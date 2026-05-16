/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { documentApi, staffProfileApi } from "@/lib/api";
import KycSystemDashboard from "./KycSystemDashboard";
import {
  getDocumentCategory,
  getDocumentRequirementName,
  getProfileDocumentRequirements,
} from "@/lib/documentRequirements";

interface ApplicationDetailViewProps {
  application: any;
  onBack: () => void;
}

type OcrSummaryDoc = {
  id: string;
  name: string;
  docName?: string;
  docType: string;
  category: string;
  status: string;
  uploaded?: boolean;
  fileName?: string;
  uploadedAt?: string;
  accuracy?: number | string;
  fieldsExtracted?: number;
  extractedData?: Record<string, unknown>;
  verificationMetadata?: {
    extractedFields?: Record<string, unknown>;
  };
};

type ValidationCheck = {
  label: string;
  detail: string;
  status: "success" | "warning" | "pending";
};

type ApiResult<T> = {
  success?: boolean;
  data?: T;
};

const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  application,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("requirements");
  const [activeSidebarMenu, setActiveSidebarMenu] = useState("application_details");

  const progress = application.progress || 90;
  const status = (application.status || "APPROVED").toUpperCase();
  const appId = `APP${(application.id || application._id || "MO2V2P4UQZEU").slice(-10).toUpperCase()}`;
  const studentId = (application.studentId || "482C9247-D456-4BF7-AF41-1AA98B4C9A06").toUpperCase();

  const [messages, setMessages] = useState([
    { id: 1, sender: "staff", text: `Hello ${application.firstName || "Applicant"}, we noticed that your 10th standard marksheet is slightly blurred. Could you please upload a clearer scan?`, time: "10:45 AM", type: "chat" },
    { id: 2, sender: "student", text: "Sure, I'll upload it right away. Give me 5 minutes.", time: "11:12 AM", type: "chat" },
    { id: 3, sender: "system", text: "New Document Uploaded: Marksheet_10th_Final.pdf", time: "11:15 AM", type: "notification" },
  ]);
  const [notes, setNotes] = useState([
    { id: 1, author: "Ananya Deshmukh", role: "Senior Auditor", text: "Student has excellent academic pedigree. Waitlisted at UofT but current profile shows high employability in data science. Financials look solid; father's income is consistent for last 3 years.", time: "2 DAYS AGO" },
    { id: 2, author: "Staff Member", role: "Relationship Manager", text: "Requested a clearer scan of 10th marksheet. Verification pending for academic section.", time: "TODAY • 10:15 AM" },
  ]);
  const [msgInput, setMsgInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  // Dynamic Documents State
  const [documents, setDocuments] = useState<OcrSummaryDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const userId = application.userId || application.user_id || application.applicantId || application.student?.id || application.student?._id || application.user?.id || application.user?._id;

  const fetchDocuments = async () => {
    if (!userId) return;
    setLoadingDocs(true);
    try {
      const res = await documentApi.getUserDocuments(userId) as ApiResult<Array<Record<string, unknown>>>;
      if (res.success && res.data) {
        const inferredRequirements = getProfileDocumentRequirements(application);
        const mappedDocs = res.data.map((d) => {
          const docType = String(d.docType || "");
          const metadata = d.verificationMetadata as any;
          const docName = getDocumentRequirementName(docType, String(d.docName || metadata?.docName || docType || "Document"), application);
          const filePath = String(d.filePath || "");
          const isUploaded = Boolean(d.uploaded || filePath);
          const statusValue = String(d.status || (isUploaded ? "uploaded" : "pending"));
          const extractedFields = metadata?.extractedFields || metadata?.details?.extractedFields || {};
          const uploadedAt = d.uploadedAt || d.uploaded_at || d.createdAt || d.created_at || d.updatedAt || d.updated_at;
          return {
            id: String(d.id || docType || docName),
            name: docName.replace(/_/g, ' ').toUpperCase(),
            category: getDocumentCategory(docType),
            status: statusValue,
            uploaded: isUploaded,
            fileName: filePath ? filePath.split(/[/\\]/).pop() : '',
            uploadedAt: uploadedAt ? String(uploadedAt) : undefined,
            accuracy: metadata?.confidence || metadata?.confidence_score || Number(d.confidence || 0) || (statusValue === 'verified' ? 100 : 0),
            fieldsExtracted: Object.keys(extractedFields).length,
            extractedData: extractedFields,
            verificationMetadata: metadata,
            docType
          };
        });

        const mergedDocs = [...mappedDocs];
        inferredRequirements.forEach(req => {
          if (!mappedDocs.some(d => d.docType === req.type)) {
            mergedDocs.push({
              id: `req-${req.type}`,
              name: req.name.toUpperCase(),
              category: req.category,
              status: 'pending',
              uploaded: false,
              fileName: '',
              uploadedAt: undefined,
              accuracy: 0,
              fieldsExtracted: 0,
              extractedData: {},
              verificationMetadata: undefined,
              docType: req.type
            });
          }
        });

        setDocuments(mergedDocs);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("academic");

  // OCR Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedDocForSync, setSelectedDocForSync] = useState<any>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<OcrSummaryDoc | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSendMessage = () => {
    if (!msgInput.trim()) return;
    const newMessage = {
      id: Date.now(),
      sender: "staff",
      text: msgInput,
      time: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + " IST",
      type: "chat"
    };
    setMessages([...messages, newMessage]);
    setMsgInput("");
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote = {
      id: Date.now(),
      author: "Staff Member",
      role: "Level 4 Admin",
      text: noteInput,
      time: "JUST NOW"
    };
    setNotes([...notes, newNote]);
    setNoteInput("");
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim() || !userId) return;

    // Create a docType from name
    const docType = `custom_${newDocName.toLowerCase().replace(/\s+/g, '_')}`;

    try {
      // Call Backend to persist the requirement
      await documentApi.addRequirement(userId, docType, newDocName);

      // Refresh documents to show the new requirement
      await fetchDocuments();

      setNewDocName("");
      setIsAddDocModalOpen(false);
    } catch (err) {
      console.error("Failed to add requirement:", err);
      alert("Failed to save requirement to database. Please check your connection.");
    }
  };

  const handleSyncField = async (field: string, value: any) => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      // In a real app, this would call adminApi.updateUserDetails or similar
      // For now we'll simulate it and update local state
      console.log(`Syncing ${field} with value ${value}`);

      // Map OCR keys to application keys
      const keyMap: any = {
        'full_name': 'firstName', // simplified for demo
        'date_of_birth': 'dob',
        'document_number': 'panNumber',
        'father_name': 'fatherName'
      };

      // Mock update - in real app call API
      // await adminApi.updateUserDetails({ email: application.email, [keyMap[field] || field]: value });

      // Update local application object if possible (though it's a prop)
      // Ideally we should have a callback to refresh the parent application data

      alert(`Synced ${field} successfully!`);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (docIdOrType: string, file: File) => {
    if (!userId) return;

    // Find docType from either ID or direct Type string
    const doc = documents.find(d => d.id === docIdOrType || d.docType === docIdOrType);
    const docType = doc ? doc.docType : docIdOrType;

    try {
      const res = await documentApi.upload(userId, docType, file) as ApiResult<unknown>;
      if (res.success) {
        fetchDocuments(); // Refresh from server
        if (typeof window !== "undefined") {
          localStorage.setItem(`dashboardDataUpdated_${userId}`, String(Date.now()));
          window.dispatchEvent(new Event('dashboard-data-changed'));
        }

        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: "system",
          text: `Document Uploaded: ${file.name}`,
          time: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + " IST",
          type: "notification"
        }]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload document");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !userId) return;

    if (!confirm(`Are you sure you want to delete ${doc.name}?`)) return;

    try {
      const res = await documentApi.delete(userId, doc.docType) as ApiResult<unknown>;
      if (res.success) {
        fetchDocuments();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const createdDateIST = (() => {
    if (application.registeredAtIndia) return application.registeredAtIndia;
    const ds = application.createdAt || application.created_at || application.student?.createdAt || application.student?.created_at;
    if (!ds) return "â€”";
    try {
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "â€”";
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date) + " IST";
    } catch (e) { return "â€”"; }
  })();

  const shortCreatedDateIST = (() => {
    if (application.registeredAtIndia) return application.registeredAtIndia.split(' ')[0]; // Just the date part
    const ds = application.createdAt || application.created_at || application.student?.createdAt || application.student?.created_at;
    if (!ds) return "PENDING";
    try {
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "PENDING";
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (e) { return "PENDING"; }
  })();

  const getBankStepLabel = () => {
    if (status === 'REJECTED') return "BANK REJECTED";
    if (status === 'UNDER_REVIEW') return "UNDER REVIEW";
    if (status === 'APPROVED') return "BANK APPROVED";
    return "BANK REVIEW";
  };

  // Format timestamp as compact "APR 28, 15:24" to match the progress bar style
  const formatStepDateTime = (ds?: string): string => {
    if (!ds) return "";
    try {
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "";
      const d = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
      // Produce format: "APR 28, 15:24"
      const parts = d.split(' ');
      // en-IN gives: "28 Apr, 15:24" — reorder to month first
      const raw = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
      const monthMatch = raw.match(/([A-Za-z]{3})/)?.[1]?.toUpperCase() || '';
      const dayMatch = raw.match(/(\d{2}(?=\s[A-Za-z])|(?<=[A-Za-z]\s)\d{2})/)?.[0] || String(date.getDate()).padStart(2, '0');
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      return `${monthMatch} ${dayMatch}, ${timeStr}`;
    } catch {
      return "";
    }
  };

  // Determine per-step timestamps from application data
  const appCreatedAt = application.createdAt || application.created_at || application.submittedAt || application.submitted_at;
  const appUpdatedAt = application.updatedAt || application.updated_at || appCreatedAt;

  // Find the index of the last completed stage
  const completedThresholds = [10, 25, 40, 60, 75, 90, 95, 100];
  const lastCompletedIdx = completedThresholds.reduce((acc, threshold, idx) => progress >= threshold ? idx : acc, -1);

  const getStepStatus = (completed: boolean, active?: boolean) => {
    if (active) return "IN PROGRESS";
    return completed ? "COMPLETED" : "PENDING";
  };

  // All completed steps show a timestamp; the most recent one uses updatedAt, others use createdAt as baseline
  const getStageTimestamp = (stageIdx: number, completed: boolean, active?: boolean): string | undefined => {
    if (!completed && !active) return undefined;
    // First step always uses baseline
    if (stageIdx === 0) return appCreatedAt;
    // Active or last completed step uses updatedAt
    if (active || stageIdx === lastCompletedIdx) return appUpdatedAt || appCreatedAt;
    // intermediate completed steps use baseline
    return appCreatedAt;
  };

  const stages = [
    { label: "APPLICATION CREATED", icon: "bolt", date: getStepStatus(progress >= 10), completed: progress >= 10, timestamp: getStageTimestamp(0, progress >= 10) },
    { label: "APPLICATION SUBMITTED", icon: "send", date: getStepStatus(progress >= 25), completed: progress >= 25, timestamp: getStageTimestamp(1, progress >= 25) },
    { label: "DOCUMENTS VERIFICATION", icon: "verified", date: getStepStatus(progress >= 40), completed: progress >= 40, timestamp: getStageTimestamp(2, progress >= 40) },
    { label: "SUBMIT TO BANK", icon: "account_balance", date: getStepStatus(progress >= 60), completed: progress >= 60, timestamp: getStageTimestamp(3, progress >= 60) },
    { label: "CREDIT CHECK", icon: "credit_score", date: getStepStatus(progress >= 75), completed: progress >= 75, timestamp: getStageTimestamp(4, progress >= 75) },
    { label: getBankStepLabel(), icon: "rate_review", date: getStepStatus(progress >= 90, progress >= 75 && progress < 90), completed: progress >= 90, active: progress >= 75 && progress < 90, timestamp: getStageTimestamp(5, progress >= 90, progress >= 75 && progress < 90) },
    { label: "SANCTION", icon: "assignment_turned_in", date: getStepStatus(progress >= 95, progress >= 90 && progress < 95), completed: progress >= 95, active: progress >= 90 && progress < 95, timestamp: getStageTimestamp(6, progress >= 95, progress >= 90 && progress < 95) },
    { label: "DISBURSEMENT", icon: "payments", date: getStepStatus(progress >= 100, progress >= 95 && progress < 100), completed: progress >= 100, active: progress >= 95 && progress < 100, timestamp: getStageTimestamp(7, progress >= 100, progress >= 95 && progress < 100) },
  ];

  const getBankLogo = () => {
    const bName = (application.bank || application.targetBank || "").toLowerCase();
    if (bName.includes("idfc")) return "/images/lenders/idfc-first-bank.jpg";
    if (bName.includes("avanse")) return "/images/lenders/avanse.jpg";
    if (bName.includes("auxilo")) return "/images/lenders/auxilo.png";
    if (bName.includes("credila") || bName.includes("hdfc")) return "/images/lenders/hdfc-credila.png";
    if (bName.includes("poonawalla")) return "/images/lenders/poonawalla.png";
    return null;
  };

  const getComparableValue = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizeConfidence = (value: unknown) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    const percentValue = numericValue <= 1 ? numericValue * 100 : numericValue;
    return Math.max(0, Math.min(100, Math.round(percentValue)));
  };
  const formatDocTitle = (doc: OcrSummaryDoc) => {
    const rawName = doc.name || doc.docName || doc.docType || "Document";
    return String(rawName)
      .replace(/^(father|mother|coapplicant)[\s_-]+/i, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const getDocFieldsCount = (doc: OcrSummaryDoc) => {
    const extracted = doc.extractedData || doc.verificationMetadata?.extractedFields || {};
    return doc.fieldsExtracted || Object.keys(extracted).filter((key) => extracted[key] !== undefined && extracted[key] !== null && extracted[key] !== "").length;
  };
  const formatUploadAge = (timestamp?: string) => {
    if (!timestamp) return "Upload time unavailable";
    const uploadedDate = new Date(timestamp);
    if (Number.isNaN(uploadedDate.getTime())) return "Upload time unavailable";

    const diffMs = Date.now() - uploadedDate.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMinutes < 1) return "Uploaded just now";
    if (diffMinutes < 60) return `Uploaded ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Uploaded ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Uploaded ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return `Uploaded on ${uploadedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
  };
  const isFamilyOrCoApplicantDoc = (doc: OcrSummaryDoc) => {
    const docType = String(doc.docType || "").toLowerCase();
    return ["father", "mother", "coapplicant"].some((prefix) => docType.startsWith(`${prefix}_`) || docType.includes(`${prefix}_`));
  };
  const academicOcrDocs: OcrSummaryDoc[] = documents.filter((doc) => !isFamilyOrCoApplicantDoc(doc));
  const coApplicantOcrDocs: OcrSummaryDoc[] = documents.filter(isFamilyOrCoApplicantDoc);
  const allExtractedDocs: OcrSummaryDoc[] = documents.filter((doc) => getDocFieldsCount(doc) > 0 || normalizeConfidence(doc.accuracy) > 0);
  const findExtractedValue = (keys: string[]) => {
    for (const doc of allExtractedDocs) {
      const extracted = doc.extractedData || {};
      for (const key of keys) {
        if (extracted[key]) return extracted[key];
      }
    }
    return "";
  };
  const fullName = `${application.firstName || application.student?.firstName || ""} ${application.lastName || application.student?.lastName || ""}`.trim();
  const extractedName = findExtractedValue(["full_name", "name", "student_name", "applicant_name"]);
  const extractedDob = findExtractedValue(["date_of_birth", "dob", "birth_date"]);
  const feeAmount = Number(application.totalCost || application.totalFees || application.feeStructureAmount || application.courseFee || application.tuitionFee || 0);
  const loanAmount = Number(application.loanAmount || 0);
  const nameMatched = extractedName && fullName ? getComparableValue(extractedName).includes(getComparableValue(fullName)) || getComparableValue(fullName).includes(getComparableValue(extractedName)) : false;
  const dobMatched = extractedDob && application.dob ? getComparableValue(extractedDob) === getComparableValue(application.dob) : false;
  const hasCoapplicantPan = coApplicantOcrDocs.some((doc) => String(doc.docType || "").toLowerCase().includes("pan") && getDocFieldsCount(doc) > 0);
  const hasCoapplicantItr = coApplicantOcrDocs.some((doc) => String(doc.docType || "").toLowerCase().includes("itr") && getDocFieldsCount(doc) > 0);

  const validationChecks: ValidationCheck[] = [
    {
      label: "Name match across uploaded documents",
      detail: nameMatched ? `${fullName} verified from OCR data` : extractedName ? `${String(extractedName)} needs profile review` : "Waiting for extracted name data",
      status: nameMatched ? "success" : extractedName ? "warning" : "pending",
    },
    {
      label: "DOB consistency",
      detail: dobMatched ? `${String(extractedDob)} matches the profile` : extractedDob ? `${String(extractedDob)} differs from profile DOB` : "Waiting for DOB extraction",
      status: dobMatched ? "success" : extractedDob ? "warning" : "pending",
    },
    {
      label: "Co-applicant ITR matches PAN",
      detail: hasCoapplicantPan && hasCoapplicantItr ? "PAN and ITR documents are available for review" : "Upload both PAN and ITR to validate",
      status: hasCoapplicantPan && hasCoapplicantItr ? "success" : "pending",
    },
    {
      label: "Loan amount within fee range",
      detail: feeAmount > 0 && loanAmount > 0 ? `Requested Rs ${loanAmount.toLocaleString("en-IN")}; fees Rs ${feeAmount.toLocaleString("en-IN")}` : "Fee and loan amount data incomplete",
      status: feeAmount > 0 && loanAmount > 0 && loanAmount <= feeAmount ? "success" : feeAmount > 0 && loanAmount > feeAmount ? "warning" : "pending",
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 left-[56px] z-[40] flex flex-col bg-[#F8FAFC] overflow-hidden animate-in fade-in duration-500" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-emerald-50/50 blur-[100px] rounded-full -z-10" />

      {/* Top Navbar - Glassmorphism */}
      <div className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-[80] shadow-sm">
        <div className="flex flex-col">
          <p className="text-[10px] font-['Playfair_Display',serif] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">STAFF DASHBOARD</p>
          <h1 className="text-[24px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Application Detail</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-indigo-500 transition-colors">search</span>
            <input
              type="text"
              placeholder="Search applications, students, IDs..."
              className="pl-12 pr-6 py-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-[13px] w-[340px] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all relative">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200/60 mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-[12px] font-black text-slate-900">Staff Member</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level 4 Admin</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">person</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Secondary Left Menu */}
        <div className="w-[120px] bg-white/60 backdrop-blur-xl border-r border-slate-100/50 flex flex-col py-8 px-4 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="space-y-4">
            {[
              { id: 'application_details', label: 'Application\ndetails', icon: 'description' },
              { id: 'student', label: 'Student', icon: 'person' },
              { id: 'exams', label: 'Exams', icon: 'school' },
            ].map(menu => (
              <button
                key={menu.id}
                onClick={() => setActiveSidebarMenu(menu.id)}
                className={`w-full flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all group ${activeSidebarMenu === menu.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="mb-2">
                  <span className="material-symbols-outlined text-[24px]">{menu.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight whitespace-pre-wrap">{menu.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeSidebarMenu === 'application_details' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">

              {/* Breadcrumb / Back Navigation */}
              <div className="flex items-center gap-5">
                <button
                  onClick={onBack}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  </div>
                  <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Education Loan Terminal TEST</h2>
                </div>
              </div>

              {/* Main Info Card - Glassmorphism & Rich Styling */}
              <div className="bg-white/70 backdrop-blur-sm rounded-[40px] p-10 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100/40 transition-colors duration-1000" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-8">
                    {/* Bank Logo Area */}
                    <div className="w-24 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-sm border border-slate-50 group-hover:shadow-md transition-all duration-500">
                      {getBankLogo() ? (
                        <img src={getBankLogo()!} alt="Bank" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-[32px]">account_balance</span>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-[11px] font-['Playfair_Display',serif] font-black text-slate-400 uppercase tracking-[0.25em]">UNIVERSITY OF {(application.universityName || application.college || "TORONTO").toUpperCase()}</p>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-widest uppercase shadow-sm ${
                            ['PENDING', 'UNDER REVIEW', 'IN PROGRESS'].includes(status) 
                              ? 'bg-amber-50 text-amber-600 border-amber-100/50' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                          }`}>{status}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <h3 className="text-[36px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] tracking-tight">{application.firstName || application.student?.firstName || "Abhi"} {application.lastName || application.student?.lastName || "Y"}</h3>
                          <div className="w-px h-8 bg-slate-200" />
                          <p className="text-[20px] font-bold text-indigo-600/90">{application.courseName || application.program || "MS/M.Tech"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STUDENT IDENTIFIER</p>
                          <p className="text-[12px] font-bold text-slate-600">{studentId}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">APPLICATION ID</p>
                          <p className="text-[12px] font-bold text-slate-600">{appId}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">COURSE CATEGORY</p>
                          <p className="text-[12px] font-bold text-slate-600">{application.courseLevel || "POSTGRADUATE ABROAD"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-16 items-center pr-6">
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">LOAN AMOUNT APPLIED</p>
                      <p className="text-[44px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] leading-none tracking-tighter">{Number(application.loanAmount || 3999999).toLocaleString()}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">APPLICATION PROGRESS</p>
                      <div className="flex items-center gap-4">
                        <div className="w-[180px] bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[18px] font-black text-indigo-600 w-10 text-right">{progress}%</span>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1.5 text-slate-400">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        <p className="text-[9px] font-black uppercase tracking-widest tabular-nums text-slate-900">
                          Last Updated: {formatStepDateTime(appUpdatedAt || appCreatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Timeline - Clean & Dynamic */}
                <div className="mt-16 relative px-6">
                  <div className="absolute top-[18px] left-12 right-12 h-[4px] bg-slate-100 rounded-full" />
                  <div className="absolute top-[18px] left-12 h-[4px] bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `calc(${(stages.filter(s => s.completed).length - 1) / (stages.length - 1) * 100}% - 48px)` }} />

                  <div className="flex justify-between relative z-10">
                    {stages.map((stage, idx) => (
                      <div key={idx} className="flex flex-col items-center group/stage">
                        <div className="flex flex-col items-center gap-2 mb-3">
                          <span className={`material-symbols-outlined text-[16px] ${stage.active ? 'text-emerald-500 animate-pulse' : stage.completed ? 'text-indigo-600' : 'text-slate-300'}`}>{stage.icon}</span>
                        </div>
                        <div className={`w-10 h-10 rounded-full border-[5px] border-white shadow-lg flex items-center justify-center transition-all duration-500 group-hover/stage:scale-110 ${stage.completed ? (stage.active ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-100') : 'bg-slate-200 shadow-none'}`}>
                          {stage.completed ? (
                            <span className="material-symbols-outlined text-white text-[18px] font-black">check</span>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/50" />
                          )}
                        </div>
                        <div className="mt-4 text-center">
                          <p className={`text-[9px] font-black tracking-widest uppercase transition-colors ${stage.active ? 'text-emerald-600' : stage.completed ? 'text-slate-900' : 'text-slate-400'}`}>{stage.label}</p>
                          {stage.timestamp && (
                            <p className={`mt-1.5 text-[9px] font-black tabular-nums tracking-wide ${stage.active ? 'text-emerald-500' : 'text-slate-900'}`}>
                              {formatStepDateTime(stage.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Hub & Tabs Section */}
              <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700 delay-200">
                <div className="flex items-center justify-between border-b border-slate-200/60 px-4">
                  <div className="flex items-center gap-16">
                    {[
                      { id: "requirements", label: "REQUIREMENTS", icon: "task_alt" },
                      // { id: "kyc", label: "KYC VERIFICATION", icon: "verified_user" },
                      { id: "records", label: "STUDENT RECORDS", icon: "folder_shared" },
                      { id: "notes", label: "INTERNAL NOTES", icon: "sticky_note_2" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-5 flex items-center gap-3 text-[13px] font-black tracking-[0.15em] uppercase relative transition-all group ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <span className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300'}`}>{tab.icon}</span>
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[4px] bg-indigo-600 rounded-full shadow-[0_4px_10px_rgba(79,70,229,0.3)]" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                      <span className="material-symbols-outlined text-[18px]">print</span>
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-10">
                  <div className="col-span-12 space-y-10">
                    {activeTab === "requirements" && (
                      <OcrDocumentIntelligence
                        academicDocs={academicOcrDocs}
                        coApplicantDocs={coApplicantOcrDocs}
                        validationChecks={validationChecks}
                        loading={loadingDocs}
                        onAddAcademic={() => {
                          setNewDocCategory("academic");
                          setIsAddDocModalOpen(true);
                        }}
                        onAddCoApplicant={() => {
                          setNewDocCategory("financial");
                          setIsAddDocModalOpen(true);
                        }}
                        normalizeConfidence={normalizeConfidence}
                        formatDocTitle={formatDocTitle}
                        getDocFieldsCount={getDocFieldsCount}
                        formatUploadAge={formatUploadAge}
                        onPreviewDocument={setSelectedDocPreview}
                        onViewDocument={(doc) => window.open(`/api/documents/view/${userId}/${doc.docType}`, "_blank", "noopener,noreferrer")}
                        onDeleteDocument={(doc) => handleDeleteDocument(doc.id)}
                        onUploadDocument={(doc, file) => handleFileUpload(doc.docType, file)}
                      />
                    )}

                    {activeTab === "kyc" && (
                      <KycSystemDashboard
                        userId={userId}
                        application={application}
                        onRefresh={fetchDocuments}
                      />
                    )}

                    {activeTab === "records" && (
                      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-[620px]">
                        <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                              <span className="material-symbols-outlined text-[22px]">forum</span>
                            </div>
                            <div>
                              <h3 className="text-[18px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Communication Hub</h3>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Direct two-way channel</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-slate-50/40">
                          {messages.map((msg) => (
                            <React.Fragment key={msg.id}>
                              {msg.type === "notification" ? (
                                <div className="flex justify-center">
                                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[11px] font-bold">
                                    <span className="material-symbols-outlined text-[16px]">file_present</span>
                                    {msg.text}
                                  </div>
                                </div>
                              ) : (
                                <div className={`flex flex-col space-y-2 ${msg.sender === "staff" ? "items-end" : "items-start"}`}>
                                  <div className={`max-w-[80%] px-6 py-4 rounded-t-3xl shadow-lg ${msg.sender === "staff" ? "bg-indigo-600 text-white rounded-bl-3xl shadow-indigo-100" : "bg-white border border-slate-100 text-slate-700 rounded-br-3xl shadow-sm"}`}>
                                    <p className="text-[14px] leading-relaxed">{msg.text}</p>
                                  </div>
                                  <p className={`text-[10px] font-bold text-slate-400 ${msg.sender === "staff" ? "mr-2" : "ml-2"}`}>
                                    {msg.sender === "staff" ? "STAFF" : "STUDENT"} • {msg.time}
                                  </p>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="p-6 bg-white border-t border-slate-100">
                          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-3xl p-2 pl-6 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                            <input
                              type="text"
                              value={msgInput}
                              onChange={(e) => setMsgInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                              placeholder="Request documents or ask for information..."
                              className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] py-3 font-medium placeholder:text-slate-400"
                            />
                            <button onClick={handleSendMessage} className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                              <span className="material-symbols-outlined text-[24px]">send</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "notes" && (
                      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
                              <span className="material-symbols-outlined text-[22px]">sticky_note_2</span>
                            </div>
                            <div>
                              <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Internal Staff Notes</h3>
                              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Confidential • staff only</p>
                            </div>
                          </div>
                          <button onClick={handleAddNote} className="flex items-center gap-2 px-5 py-2.5 bg-[#0d1b2a] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Note
                          </button>
                        </div>
                        <div className="space-y-4">
                          {notes.map((note) => (
                            <div key={note.id} className="p-6 rounded-3xl bg-slate-50/80 border border-slate-100 hover:border-amber-200 transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <p className="text-[12px] font-black text-slate-900">{note.author} <span className="font-medium text-slate-400 ml-2">{note.role}</span></p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{note.time}</p>
                              </div>
                              <p className="text-[14px] text-slate-600 leading-relaxed">{note.text}</p>
                            </div>
                          ))}
                        </div>
                        <textarea
                          rows={3}
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Write an internal observation or note..."
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl p-5 text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 transition-all resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSidebarMenu === 'student' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-5">
                <button
                  onClick={onBack}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Student Profile</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registered: {createdDateIST}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-[40px] p-10 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative">
                <div className="flex gap-16">
                  <div className="flex-1 space-y-8">
                    <section>
                      <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">person</span> Personal Information</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registration Time</p>
                          <p className="text-[14px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">{createdDateIST}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">First Name</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.firstName || application.student?.firstName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Name</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.lastName || application.student?.lastName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.dob || application.student?.dob || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.email || application.student?.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.phone || application.student?.phone || application.mobile || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gender</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.gender || application.student?.gender || "—"}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">location_on</span> Address Details</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Address</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.address || application.student?.mailingAddress?.address1 || application.student?.address || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">City / Pincode</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.city || application.student?.mailingAddress?.city || "—"} - {application.pincode || application.student?.mailingAddress?.pincode || "—"}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">public</span> Nationality & Background</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nationality</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.nationality || application.student?.nationality?.name || "Indian"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visa Refusal</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.student?.background?.visaRefusal || "No"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Medical Condition</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.student?.background?.medicalCondition || "No"}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">contact_emergency</span> Emergency Contact</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Name</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.student?.emergencyContact?.name || application.emergencyContactName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Relation</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.student?.emergencyContact?.relation || application.emergencyContactRelation || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.student?.emergencyContact?.phone || application.emergencyContactPhone || "—"}</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Modals & Sub-components */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0d1b2a]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddDocModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Add Document Requirement</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define what the student needs to upload</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Document Name</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Master's Admission Letter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {['academic', 'financial', 'identity'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewDocCategory(cat)}
                      className={`py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${newDocCategory === cat
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/30'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!newDocName.trim()}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
              >
                Create Requirement
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDocPreview && (
        <DocumentPreviewDrawer
          doc={selectedDocPreview}
          userId={userId}
          title={formatDocTitle(selectedDocPreview)}
          uploadAge={formatUploadAge(selectedDocPreview.uploadedAt)}
          onClose={() => setSelectedDocPreview(null)}
        />
      )}

      {/* OCR Sync Modal */}
      {isSyncModalOpen && selectedDocForSync && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0d1b2a]/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsSyncModalOpen(false)} />
          <div className="bg-white w-full max-w-[1100px] h-[85vh] rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20 flex flex-col">

            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                  <span className="material-symbols-outlined text-[32px]">sync_alt</span>
                </div>
                <div>
                  <h3 className="text-[24px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Review & Sync Data</h3>
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">AI-Powered Extraction Verification</p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="w-12 h-12 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Document Preview */}
              <div className="w-1/2 bg-slate-900 flex items-center justify-center relative group">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                <img
                  src={`/api/documents/view/${userId}/${selectedDocForSync.docType}`}
                  alt="Document Preview"
                  className="max-h-[90%] max-w-[90%] object-contain shadow-2xl rounded-lg border border-white/10"
                  onError={(e: any) => {
                    e.target.src = "https://images.unsplash.com/photo-1586281380349-631531a34d4f?q=80&w=2070&auto=format&fit=crop";
                  }}
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-[11px] font-medium text-center">Original scan provided by the applicant</p>
                </div>
              </div>

              {/* Right Side: Comparison Table */}
              <div className="w-1/2 flex flex-col bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Field Mapping</h4>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
                    {selectedDocForSync.accuracy?.toFixed(1)}% CONFIDENCE
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {/* Field Row Component */}
                  {[
                    { label: 'Full Name', key: 'full_name', current: application.firstName + " " + application.lastName, extracted: selectedDocForSync.extractedData?.full_name || "Abhiram Y" },
                    { label: 'Date of Birth', key: 'date_of_birth', current: application.dob || "—", extracted: selectedDocForSync.extractedData?.date_of_birth || "14-08-1998" },
                    { label: 'PAN Number', key: 'document_number', current: application.panNumber || "—", extracted: selectedDocForSync.extractedData?.document_number || "ABCDP1234F" },
                    { label: 'Father\'s Name', key: 'father_name', current: application.fatherName || "—", extracted: selectedDocForSync.extractedData?.father_name || "Y. Venkatesh" },
                    { label: 'Issuing Authority', key: 'issuing_authority', current: "—", extracted: selectedDocForSync.extractedData?.issuing_authority || "Income Tax Dept." }
                  ].map((field, idx) => (
                    <div key={idx} className="group/row">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                        {field.current !== field.extracted && field.extracted && (
                          <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1 animate-pulse">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            Mismatched
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Profile Value</p>
                          <p className="text-[14px] font-bold text-slate-600">{field.current}</p>
                        </div>

                        <div className={`p-4 rounded-2xl border relative group transition-all ${field.current === field.extracted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-indigo-50/30 border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5'}`}>
                          <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">AI Extracted</p>
                          <p className="text-[14px] font-bold text-indigo-700">{field.extracted}</p>

                          <button
                            onClick={() => handleSyncField(field.key, field.extracted)}
                            disabled={isSyncing || field.current === field.extracted}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${field.current === field.extracted
                              ? 'bg-emerald-500 text-white cursor-default'
                              : 'bg-indigo-600 text-white hover:scale-110 active:scale-95 shadow-lg shadow-indigo-200'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {field.current === field.extracted ? 'check' : 'sync'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500">verified_user</span>
                    <p className="text-[11px] font-medium text-slate-600">Manual review recommended before final sync</p>
                  </div>
                  <button
                    onClick={() => setIsSyncModalOpen(false)}
                    className="px-8 py-3.5 bg-[#0d1b2a] text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                  >
                    Complete Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OcrDocumentIntelligence = ({
  academicDocs,
  coApplicantDocs,
  validationChecks,
  loading,
  onAddAcademic,
  onAddCoApplicant,
  normalizeConfidence,
  formatDocTitle,
  getDocFieldsCount,
  formatUploadAge,
  onPreviewDocument,
  onViewDocument,
  onDeleteDocument,
  onUploadDocument,
}: {
  academicDocs: OcrSummaryDoc[];
  coApplicantDocs: OcrSummaryDoc[];
  validationChecks: ValidationCheck[];
  loading: boolean;
  onAddAcademic: () => void;
  onAddCoApplicant: () => void;
  normalizeConfidence: (value: unknown) => number;
  formatDocTitle: (doc: OcrSummaryDoc) => string;
  getDocFieldsCount: (doc: OcrSummaryDoc) => number;
  formatUploadAge: (timestamp?: string) => string;
  onPreviewDocument: (doc: OcrSummaryDoc) => void;
  onViewDocument: (doc: OcrSummaryDoc) => void;
  onDeleteDocument: (doc: OcrSummaryDoc) => void;
  onUploadDocument: (doc: OcrSummaryDoc, file: File) => void;
}) => (
  <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-2 gap-6">
      <OcrDocumentGroup
        title="Applicant Documents"
        icon="school"
        docs={academicDocs}
        loading={loading}
        onAdd={onAddAcademic}
        normalizeConfidence={normalizeConfidence}
        formatDocTitle={formatDocTitle}
        getDocFieldsCount={getDocFieldsCount}
        formatUploadAge={formatUploadAge}
        onPreviewDocument={onPreviewDocument}
        onViewDocument={onViewDocument}
        onDeleteDocument={onDeleteDocument}
        onUploadDocument={onUploadDocument}
      />
      <OcrDocumentGroup
        title="Family & Co-Applicant Documents"
        icon="group"
        docs={coApplicantDocs}
        loading={loading}
        onAdd={onAddCoApplicant}
        normalizeConfidence={normalizeConfidence}
        formatDocTitle={formatDocTitle}
        getDocFieldsCount={getDocFieldsCount}
        formatUploadAge={formatUploadAge}
        onPreviewDocument={onPreviewDocument}
        onViewDocument={onViewDocument}
        onDeleteDocument={onDeleteDocument}
        onUploadDocument={onUploadDocument}
      />
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-[22px] text-indigo-600">shield</span>
        <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Cross-Document Validation</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {validationChecks.map((check) => (
          <OcrValidationCard key={check.label} check={check} />
        ))}
      </div>
    </div>
  </div>
);

const OcrDocumentGroup = ({
  title,
  icon,
  docs,
  loading,
  onAdd,
  normalizeConfidence,
  formatDocTitle,
  getDocFieldsCount,
  formatUploadAge,
  onPreviewDocument,
  onViewDocument,
  onDeleteDocument,
  onUploadDocument,
}: {
  title: string;
  icon: string;
  docs: OcrSummaryDoc[];
  loading: boolean;
  onAdd: () => void;
  normalizeConfidence: (value: unknown) => number;
  formatDocTitle: (doc: OcrSummaryDoc) => string;
  getDocFieldsCount: (doc: OcrSummaryDoc) => number;
  formatUploadAge: (timestamp?: string) => string;
  onPreviewDocument: (doc: OcrSummaryDoc) => void;
  onViewDocument: (doc: OcrSummaryDoc) => void;
  onDeleteDocument: (doc: OcrSummaryDoc) => void;
  onUploadDocument: (doc: OcrSummaryDoc, file: File) => void;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[22px] text-indigo-600">{icon}</span>
        <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">{title}</h3>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 text-[14px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
        <span className="material-symbols-outlined text-[18px]">upload</span>
        Add
      </button>
    </div>

    <div className="space-y-3">
      {loading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-[118px] rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
        ))
      ) : docs.length > 0 ? (
        docs.map((doc) => (
          <OcrMiniDocumentCard
            key={doc.id || doc.docType || doc.name}
            confidence={normalizeConfidence(doc.accuracy)}
            title={formatDocTitle(doc)}
            fieldsCount={getDocFieldsCount(doc)}
            uploadAge={formatUploadAge(doc.uploadedAt)}
            status={doc.status}
            uploaded={doc.uploaded}
            fileName={doc.fileName}
            onPreview={() => onPreviewDocument(doc)}
            onViewFile={() => onViewDocument(doc)}
            onDelete={() => onDeleteDocument(doc)}
            onUpload={(file) => onUploadDocument(doc, file)}
          />
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
          <span className="material-symbols-outlined text-[28px] text-slate-300 mb-2 block">description</span>
          <p className="text-[12px] font-bold text-slate-500">No uploaded documents yet</p>
        </div>
      )}
    </div>
  </div>
);

const OcrMiniDocumentCard = ({
  confidence,
  title,
  fieldsCount,
  uploadAge,
  status,
  uploaded,
  fileName,
  onPreview,
  onViewFile,
  onDelete,
  onUpload,
}: {
  confidence: number;
  title: string;
  fieldsCount: number;
  uploadAge: string;
  status: string;
  uploaded?: boolean;
  fileName?: string;
  onPreview: () => void;
  onViewFile: () => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(uploaded || fileName || ["uploaded", "verified", "rejected"].includes(String(status || "").toLowerCase()));
  const tone =
    confidence >= 90
      ? { text: "text-emerald-700", bar: "bg-emerald-500", icon: "verified", iconText: "text-emerald-600" }
      : confidence >= 75
        ? { text: "text-amber-700", bar: "bg-amber-500", icon: "warning", iconText: "text-amber-500" }
        : confidence > 0
          ? { text: "text-rose-700", bar: "bg-rose-500", icon: "error", iconText: "text-rose-500" }
          : { text: "text-slate-500", bar: "bg-slate-300", icon: "pending", iconText: "text-slate-400" };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="material-symbols-outlined text-[22px] text-slate-500 mt-0.5">description</span>
          <div className="min-w-0">
            <h4 className="text-[17px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate">{title}</h4>
            <p className="text-[14px] font-medium text-slate-500">{hasFile ? `${fieldsCount} fields extracted` : "Pending upload"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasFile && (
            <button
              type="button"
              onClick={onPreview}
              title={`Quick look: ${title}`}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            title={`Delete ${title}`}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
        {uploadAge}
      </div>
      {hasFile && (
        <div className="mt-4">
          <p className={`text-[12px] font-black uppercase tracking-widest mb-2 ${tone.text}`}>
            {confidence}% Confidence
          </p>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${confidence}%` }} />
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        {hasFile && (
          <button
            type="button"
            onClick={onViewFile}
            className="inline-flex items-center gap-2 text-[12px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">open_in_new</span>
            View file
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 text-[12px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors"
        >
          <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
          {hasFile ? "Re-upload" : "Upload"}
        </button>
      </div>
    </div>
  );
};

const OcrValidationCard = ({ check }: { check: ValidationCheck }) => {
  const tone =
    check.status === "success"
      ? "border-emerald-200 bg-emerald-50/40 text-emerald-600"
      : check.status === "warning"
        ? "border-amber-200 bg-amber-50/40 text-amber-600"
        : "border-slate-200 bg-slate-50/70 text-slate-500";
  const icon = check.status === "success" ? "check_circle" : check.status === "warning" ? "warning" : "pending";

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${tone}`}>
      <span className="material-symbols-outlined text-[20px] mt-0.5">{icon}</span>
      <div>
        <h4 className="text-[14px] font-bold text-[#0d1b2a]">{check.label}</h4>
        <p className="text-[13px] font-medium text-slate-600 mt-1">{check.detail}</p>
      </div>
    </div>
  );
};

const DocumentPreviewDrawer = ({
  doc,
  userId,
  title,
  uploadAge,
  onClose,
}: {
  doc: OcrSummaryDoc;
  userId: string;
  title: string;
  uploadAge: string;
  onClose: () => void;
}) => {
  const previewUrl = `/api/documents/view/${userId}/${doc.docType}`;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[#0d1b2a]/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close document preview"
      />
      <aside className="relative z-10 h-full w-full max-w-[620px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Quick Look</span>
            </div>
            <h3 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate">{title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              {uploadAge}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
          <div className="h-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-inner">
            <iframe
              src={previewUrl}
              title={`${title} preview`}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</p>
            <p className="text-[13px] font-bold text-slate-700 truncate">{doc.docType.replace(/_/g, " ")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0d1b2a] text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
};

const DocumentCard = ({ doc, onUpload, onDelete, onReviewSync }: { doc: any, onUpload: (file: File) => void, onDelete: () => void, onReviewSync: (doc: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const getIcon = () => {
    switch (doc.category) {
      case 'academic': return 'school';
      case 'financial': return 'account_balance_wallet';
      case 'identity': return 'fingerprint';
      default: return 'article';
    }
  };

  const getStatusColor = () => {
    switch (doc.status) {
      case 'verified': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'uploaded': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group/card relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button onClick={onDelete} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors">
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm group-hover/card:scale-105 transition-transform ${getStatusColor()}`}>
          <span className="material-symbols-outlined text-[28px]">{getIcon()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-[#0d1b2a] truncate">{doc.name}</h4>
          <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${doc.status !== 'pending' && doc.fieldsExtracted > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {doc.status === 'pending' ? 'ACTION REQUIRED' :
              doc.fieldsExtracted > 0 ? 'DATA EXTRACTED - CLICK TO SYNC' : '0% CONFIDENCE'}
          </p>
        </div>
      </div>

      {doc.status === 'pending' ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          Upload Now
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{doc.fileName}</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase">{doc.accuracy?.toFixed(1)}% ACC</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${doc.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${doc.accuracy || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onReviewSync(doc)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
              Review & Sync
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              Re-upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailView;
