/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { documentApi, staffProfileApi, adminApi, chatApi } from "@/lib/api";
import { useDialog } from "@/contexts/DialogContext";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import KycSystemDashboard from "./KycSystemDashboard";
import ShareWithBankModal from "./ShareWithBankModal";
import SendDocumentToBankModal from "./SendDocumentToBankModal";
import SendEmailModal from "./SendEmailModal";
import NotificationsPanel from "./NotificationsPanel";
import {
  getDocumentCategory,
  getDocumentRequirementName,
  getProfileDocumentRequirements,
} from "@/lib/documentRequirements";

interface ApplicationDetailViewProps {
  application: any;
  onBack: () => void;
  onAadhaarSaved?: (aadhaarNumber: string) => void;
  onApplicationUpdated?: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

type OcrSummaryDoc = {
  id: string;
  name: string;
  docName?: string;
  docType: string;
  category: string;
  status: string;
  rejectionReason?: string;
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
  status: "success" | "warning" | "pending" | "error";
  onReview?: () => void;
};

type ApiResult<T> = {
  success?: boolean;
  data?: T;
};

const formatAmountInINR = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(num);
};

// Formats a date exactly into India Standard Time (+5:30) with timezone label
const formatIST = (dateVal: any, includeTime: boolean = true): string => {
  if (!dateVal) return "—";
  try {
    let cleanDs = dateVal;
    if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
      if (cleanDs.includes('T') || cleanDs.includes(':')) {
        const formatted = cleanDs.replace(' ', 'T');
        cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
      }
    }
    const d = new Date(cleanDs);
    if (isNaN(d.getTime())) return "—";

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: includeTime ? "2-digit" : undefined,
      minute: includeTime ? "2-digit" : undefined,
      second: includeTime ? "2-digit" : undefined,
      hour12: false
    }).formatToParts(d);

    const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";

    const month = getPart("month");
    const day = getPart("day");
    const year = getPart("year");

    if (includeTime) {
      const hour = getPart("hour");
      const minute = getPart("minute");
      const second = getPart("second");
      return `${month} ${day}, ${year} • ${hour}:${minute}:${second}`;
    } else {
      return `${month} ${day}, ${year} `;
    }
  } catch {
    return "—";
  }
};

/** Derive a readable intake season from a raw value (named season or ISO date) */
const resolveIntakeSeason = (raw?: string | null): string => {
  if (!raw) return "—";
  const s = String(raw).trim();
  if (!s) return "—";
  // Already a named season (has letters)
  if (/[a-zA-Z]/.test(s)) return s;
  // Looks like an ISO date — extract month + year
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(d);
    }
  } catch { /* ignore */ }
  return s;
};

/** Best-effort study destination resolver across all possible field paths */
const resolveDestination = (app: any): string => {
  const candidates = [
    app?.country,
    app?.destinationCountry,
    app?.studyDestination,
    app?.user?.studyDestination,
    app?.student?.studyDestination,
    app?.academic?.countryOfEducation,
    app?.user?.academic?.countryOfEducation,
    app?.user?.countryOfEducation,
  ];
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim();
  }
  return "—";
};

/** Best-effort intake season resolver across all possible field paths */
const resolveIntake = (app: any): string => {
  const candidates = [
    app?.intakeSeason,
    app?.user?.intakeSeason,
    app?.student?.intakeSeason,
    app?.targetIntake,
    app?.user?.targetIntake,
    app?.courseStartDate,
    app?.user?.courseStartDate,
  ];
  for (const c of candidates) {
    if (c && String(c).trim()) return resolveIntakeSeason(String(c).trim());
  }
  return "—";
};

const formatStepLabel = (label: string) => {
  if (label === "APPLICATION CREATED") return "Application\nCreated";
  if (label === "APPLICATION SUBMITTED") return "Application\nSubmitted";
  if (label === "DOCUMENTS VERIFICATION") return "Docs\nVerification";
  if (label === "SUBMIT TO BANK") return "Submit\nTo Bank";
  if (label === "CREDIT CHECK") return "Credit\nCheck";
  if (label === "BANK REJECTED") return "Bank\nRejected";
  if (label === "UNDER REVIEW") return "Under\nReview";
  if (label === "BANK APPROVED") return "Bank\nApproved";
  if (label === "BANK REVIEW") return "Bank\nReview";
  if (label === "SANCTION") return "Sanction";
  if (label === "DISBURSEMENT") return "Disbursement";
  return label.replace(/\s+/g, '\n');
};

const formatNoteTime = (createdAt?: string): string => {
  if (!createdAt) return "JUST NOW";
  try {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return "JUST NOW";
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date) + " IST";
  } catch {
    return "JUST NOW";
  }
};

const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  application,
  onBack,
  onAadhaarSaved,
  onApplicationUpdated,
  sidebarOpen = false,
  setSidebarOpen,
}) => {
  const { token, user, logout } = useAuth();
  const { alert: dialogAlert, confirm: dialogConfirm, prompt: dialogPrompt } = useDialog();
  const [nowTime, setNowTime] = useState<Date>(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTime(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const [activeTab, setActiveTab] = useState("requirements");
  const [activeSidebarMenu, setActiveSidebarMenu] = useState("application_details");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sendToBankDoc, setSendToBankDoc] = useState<OcrSummaryDoc | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [fetchedStatusHistory, setFetchedStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getDynamicProgress = () => {
    const s = String(application.status || '').toLowerCase();
    const baseProgress = typeof application.progress === 'number' ? application.progress : 10;

    if (['disbursed', 'closed', 'disbursement_confirmed'].includes(s)) return 100;
    if (['sanctioned', 'approved', 'sanction'].includes(s)) return Math.max(baseProgress, 95);
    if (['under_bank_review', 'bank_review'].includes(s)) return Math.max(baseProgress, 90);
    if (['credit_check', 'query_raised'].includes(s)) return Math.max(baseProgress, 75);
    if (['submitted_to_bank', 'file_logged', 'submit_to_bank', 'bank_submission'].includes(s)) return Math.max(baseProgress, 50);
    if (['staff_verified', 'documents_verification', 'document_verification', 'docs_received', 'docs_uploaded', 'under_review'].includes(s)) return Math.max(baseProgress, 40);
    if (['submitted', 'application_submitted'].includes(s)) return Math.max(baseProgress, 25);

    return baseProgress;
  };
  const progress = getDynamicProgress();
  const status = (application.status || "APPROVED").toUpperCase();
  const appId = application.applicationNumber || `APP${(application.id || application._id || "MO2V2P4UQZEU").slice(-10).toUpperCase()}`;
  const studentId = application.studentId || application.userId || "—";
  const studentId10 = application.studentId || application.userId || "—";
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic Documents State
  const [documents, setDocuments] = useState<OcrSummaryDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Bank Decisions & Queries State
  const [bankDecisions, setBankDecisions] = useState<any[]>([]);
  const [bankQueries, setBankQueries] = useState<any[]>([]);
  const [loadingBankData, setLoadingBankData] = useState(false);

  const fetchBankDecisionsAndQueries = useCallback(async () => {
    const appRefId = application.id || application._id;
    if (!appRefId) return;
    setLoadingBankData(true);
    try {
      const res = await adminApi.getApplication(appRefId) as any;
      if (res && res.success && res.data) {
        setBankDecisions(res.data.BankDecision || []);
        setBankQueries(res.data.queries || []);
      }
    } catch (err) {
      console.error("Failed to fetch bank decisions/queries:", err);
    } finally {
      setLoadingBankData(false);
    }
  }, [application.id, application._id]);

  useEffect(() => {
    fetchBankDecisionsAndQueries();
  }, [fetchBankDecisionsAndQueries]);

  const userId = application.userId || application.user_id || application.applicantId || application.student?.id || application.student?._id || application.user?.id || application.user?._id;

  // Fetch/start conversation
  useEffect(() => {
    let active = true;
    if (!application) return;

    const phone = application.phone || application.student?.phone || application.mobile || "";
    const email = application.email || application.student?.email || "";
    const name = `${application.firstName || application.student?.firstName || ""} ${application.lastName || application.student?.lastName || ""}`.trim() || "Student";

    if (!phone) {
      console.warn("No phone number found for applicant. Chat cannot be initialized.");
      return;
    }

    async function initChat() {
      try {
        const res: any = await chatApi.staffStart(phone, email, name);
        if (active && res && res.success && res.conversation) {
          const convId = res.conversation.id;
          setConversationId(convId);

          // Load historical messages
          const msgRes: any = await chatApi.getMessages(convId);
          if (active && msgRes && Array.isArray(msgRes)) {
            const mapped = msgRes.map((msg: any) => {
              const isSystem = msg.senderType === "system";
              let sender = "student";
              if (msg.senderType === "staff") {
                sender = "staff";
              } else if (msg.senderType === "system") {
                sender = "system";
              } else if (msg.senderType === "bank") {
                sender = "bank";
              }

              let formattedTime = "";
              try {
                formattedTime = format(new Date(msg.createdAt), "hh:mm a") + " IST";
              } catch (e) {
                formattedTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + " IST";
              }

              return {
                id: msg.id,
                sender,
                text: msg.content || "",
                time: formattedTime,
                type: isSystem ? "notification" : "chat"
              };
            });
            setMessages(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to start chat session:", err);
      }
    }

    initChat();

    return () => {
      active = false;
    };
  }, [application]);

  // Set up socket connection and join room
  useEffect(() => {
    if (!token) return;

    const baseApiUrl = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))
      ? 'http://localhost:5000'
      : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'));

    const socketUrl = baseApiUrl.endsWith('/api')
      ? baseApiUrl.replace('/api', '/chat')
      : `${baseApiUrl.replace(/\/$/, '')}/chat`;

    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('[ApplicationDetailView] Socket connected');
      if (conversationId) {
        newSocket.emit('join_conversation', conversationId);
      }
      newSocket.emit('joinRoom', 'room_staff');
    });

    newSocket.on('notification_received', (payload: any) => {
      console.log('[ApplicationDetailView] Live notification received in App detail view:', payload);
      const curAppId = application.id || application._id;
      const notifAppId = payload.metadata?.applicationId || payload.metadata?.id;
      if (notifAppId === curAppId || (payload.body && payload.body.includes(curAppId)) || (payload.title && payload.title.includes(curAppId))) {
        console.log('[ApplicationDetailView] Notification matches current application, reloading bank decisions & queries...');
        fetchBankDecisionsAndQueries();
      }
    });

    newSocket.on('new_message', (msg: any) => {
      if (!conversationId || msg.conversationId !== conversationId) return;

      const isSystem = msg.senderType === "system";
      let sender = "student";
      if (msg.senderType === "staff") {
        sender = "staff";
      } else if (msg.senderType === "system") {
        sender = "system";
      } else if (msg.senderType === "bank") {
        sender = "bank";
      }

      let formattedTime = "";
      try {
        formattedTime = format(new Date(msg.createdAt), "hh:mm a") + " IST";
      } catch (e) {
        formattedTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + " IST";
      }

      const incomingMsg = {
        id: msg.id,
        sender,
        text: msg.content || "",
        time: formattedTime,
        type: isSystem ? "notification" : "chat"
      };

      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });
    });

    newSocket.on('disconnect', () => {
      console.log('[ApplicationDetailView] Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      if (conversationId) {
        newSocket.emit('leave_conversation', conversationId);
      }
      newSocket.disconnect();
      setSocket(null);
    };
  }, [conversationId, token, application.id, application._id, fetchBankDecisionsAndQueries]);

  const handleVerifyDocument = async (docId: string) => {
    try {
      const res = await adminApi.verifyDocument(application.id || application._id, docId, "verified") as ApiResult<unknown>;
      if (res.success || (res as any).data) {
        await dialogAlert("Document verified successfully!", "Verification Success", "success");
        fetchDocuments();
      } else {
        await dialogAlert("Failed to verify document.", "Verification Failed", "error");
      }
    } catch (err) {
      console.error("Failed to verify document:", err);
      await dialogAlert("Error verifying document.", "System Error", "error");
    }
  };

  const handleRejectDocument = async (docId: string, reason: string) => {
    try {
      const res = await adminApi.verifyDocument(application.id || application._id, docId, "rejected", reason) as ApiResult<unknown>;
      if (res.success || (res as any).data) {
        await dialogAlert("Document rejected successfully!", "Rejection Saved", "success");
        fetchDocuments();
      } else {
        await dialogAlert("Failed to reject document.", "Rejection Failed", "error");
      }
    } catch (err) {
      console.error("Failed to reject document:", err);
      await dialogAlert("Error rejecting document.", "System Error", "error");
    }
  };

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
            id: String(d.id || d._id || docType || docName),
            name: docName.replace(/_/g, ' ').toUpperCase(),
            category: getDocumentCategory(docType),
            status: statusValue,
            rejectionReason: String(d.rejectionReason || metadata?.rejectionReason || ""),
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
              rejectionReason: '',
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

  useEffect(() => {
    const triggerStartReview = async () => {
      const isStaff = user?.role && ['admin', 'super_admin', 'staff', 'support'].includes(user.role);
      const appRefId = application?.id || application?._id;
      if (isStaff && appRefId && application?.status === 'submitted' && !application?.reviewStartedAt) {
        try {
          const res = await adminApi.getApplication(appRefId) as any;
          if (res && res.success && res.data) {
            onApplicationUpdated?.();
          }
        } catch (e) {
          console.error("Failed to trigger staff review start flow:", e);
        }
      }
    };
    triggerStartReview();
  }, [application?.id, application?._id, user?.role, application?.status, application?.reviewStartedAt]);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      const appRefId = application.id || application._id;
      if (!appRefId) return;
      setLoadingHistory(true);
      try {
        const res = await adminApi.getApplicationTracking(appRefId) as any;
        if (res && res.success && res.data) {
          setFetchedStatusHistory(res.data.timeline || []);
        }
      } catch (err) {
        console.error("Failed to fetch application tracking:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchStatusHistory();
  }, [application.id, application._id]);

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("academic");

  // OCR Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedDocForSync, setSelectedDocForSync] = useState<any>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<OcrSummaryDoc | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeDiscrepancy, setActiveDiscrepancy] = useState<{ doc1: OcrSummaryDoc; doc2: OcrSummaryDoc } | null>(null);

  const handleSendMessage = async () => {
    if (!msgInput.trim()) return;
    if (!socket || !conversationId) {
      await dialogAlert("Chat connection is not ready. Please try again in a moment.", "Connection Pending", "warning");
      return;
    }

    const customerPhone = application.phone || application.student?.phone || application.mobile || "";

    socket.emit("send_message", {
      conversationId,
      customerPhone,
      content: msgInput.trim()
    });

    setMsgInput("");
  };

  const fetchNotes = async () => {
    const appRefId = application.id || application._id;
    if (!appRefId) return;
    setLoadingNotes(true);
    try {
      const res = await adminApi.getRemarks(appRefId) as any;
      if (res && res.success && Array.isArray(res.data)) {
        setNotes(res.data);
      } else if (Array.isArray(res)) {
        setNotes(res);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [application.id, application._id]);

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    const appRefId = application.id || application._id;
    if (!appRefId) return;

    try {
      await adminApi.addRemark(appRefId, {
        type: 'note',
        content: noteInput.trim(),
        authorName: 'Staff Member',
        isInternal: true
      } as any);
      setNoteInput("");
      fetchNotes();
    } catch (err) {
      console.error("Failed to add note:", err);
      await dialogAlert("Failed to save note to database.", "Database Error", "error");
    }
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
      await dialogAlert("Failed to save requirement to database. Please check your connection.", "Network Error", "error");
    }
  };

  const handleSyncField = async (field: string, value: any) => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      console.log(`Syncing ${field} with value ${value}`);
      const userEmail = application.email || application.user?.email || application.student?.email;
      if (!userEmail) {
        throw new Error("Candidate email not found on the application.");
      }

      if (field === 'date_of_birth') {
        const currentFirstName = application.firstName || application.user?.firstName || application.student?.firstName || "";
        const currentLastName = application.lastName || application.user?.lastName || application.student?.lastName || "";
        const currentPhone = application.phone || application.user?.phoneNumber || application.student?.phone || application.mobile || "";

        // 1. Update User Profile in the User table
        const profileRes = await adminApi.updateUserDetails({
          email: userEmail,
          firstName: currentFirstName,
          lastName: currentLastName,
          phoneNumber: currentPhone,
          dateOfBirth: value
        });

        // 2. Update Application details in the LoanApplication table
        const appRes = await adminApi.updateApplication(application.id, {
          dateOfBirth: value
        });

        if (profileRes && appRes) {
          onApplicationUpdated?.();
          await dialogAlert("Date of Birth synced to user profile and application successfully!", "Sync Success", "success");
        } else {
          throw new Error("Failed to update user details or application details.");
        }
      } else if (field === 'full_name') {
        const nameParts = value.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const currentPhone = application.phone || application.user?.phoneNumber || application.student?.phone || application.mobile || "";
        const currentDob = application.dob || application.user?.dateOfBirth || application.student?.dob || "";

        // 1. Update User Profile
        const profileRes = await adminApi.updateUserDetails({
          email: userEmail,
          firstName,
          lastName,
          phoneNumber: currentPhone,
          dateOfBirth: currentDob
        });

        // 2. Update Application details
        const appRes = await adminApi.updateApplication(application.id, {
          firstName,
          lastName
        });

        if (profileRes && appRes) {
          onApplicationUpdated?.();
          await dialogAlert("Name synced to user profile and application successfully!", "Sync Success", "success");
        } else {
          throw new Error("Failed to update user name.");
        }
      } else {
        // Fallback for other fields
        const keyMap: any = {
          'document_number': 'panNumber',
          'father_name': 'fatherName'
        };
        const appKey = keyMap[field] || field;
        const appRes = await adminApi.updateApplication(application.id, {
          [appKey]: value
        });
        if (appRes) {
          onApplicationUpdated?.();
          await dialogAlert(`Synced ${field} successfully!`, "Sync Success", "success");
        } else {
          throw new Error(`Failed to sync field ${field}`);
        }
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      await dialogAlert(err.message || `Failed to sync ${field} to profile. Please try again.`, "Sync Failed", "error");
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
      await dialogAlert("Failed to upload document", "Upload Error", "error");
    }
  };

  const handleDownloadDocument = async (doc: OcrSummaryDoc) => {
    if (!userId || !doc.docType) return;
    try {
      const result: any = await documentApi.getPresignedView(userId, doc.docType);
      if (result?.url) {
        const link = document.createElement("a");
        link.href = result.url;
        link.download = `${(doc.name || doc.docType).replace(/\s+/g, "_")}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(`/api/documents/view/${userId}/${doc.docType}`, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(`/api/documents/view/${userId}/${doc.docType}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !userId) return;

    const confirmed = await dialogConfirm(`Are you sure you want to delete ${doc.name}?`, "Delete Document");
    if (!confirmed) return;

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
    const regAtInd = application.registeredAtIndia || application.student?.registeredAtIndia || application.user?.registeredAtIndia;
    if (regAtInd && typeof regAtInd === 'string' && regAtInd.endsWith(' IST')) return regAtInd;
    const ds = regAtInd || application.date || application.submittedAt || application.createdAt || application.created_at || application.student?.createdAt || application.student?.created_at || application.user?.createdAt || application.user?.created_at || application.updatedAt;
    if (!ds) return "—";
    try {
      let cleanDs = ds;
      if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
        if (cleanDs.includes('T') || cleanDs.includes(':')) {
          const formatted = cleanDs.replace(' ', 'T');
          cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
        }
      }
      const date = new Date(cleanDs);
      if (isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }).format(date);
    } catch (e) { return "—"; }
  })();

  const shortCreatedDateIST = (() => {
    const regAtInd = application.registeredAtIndia || application.student?.registeredAtIndia || application.user?.registeredAtIndia;
    if (regAtInd && typeof regAtInd === 'string' && regAtInd.endsWith(' IST')) {
      try {
        const parts = regAtInd.split(' ');
        if (parts.length >= 2) {
          const datePart = parts[0]; // "2026-05-18"
          const ymd = datePart.split('-');
          if (ymd.length === 3) {
            const month = parseInt(ymd[1], 10) - 1;
            const day = parseInt(ymd[2], 10);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthStr = months[month] || "Jan";
            const dayStr = String(day).padStart(2, '0');
            const timePart = parts[1]; // "HH:MM:SS"
            const hm = timePart.split(':');
            if (hm.length >= 2) {
              return `${dayStr} ${monthStr}, ${hm[0]}:${hm[1]}`;
            }
          }
        }
      } catch { }
      return regAtInd.split(' ')[0];
    }
    const ds = regAtInd || application.createdAt || application.created_at || application.student?.createdAt || application.student?.created_at || application.user?.createdAt || application.user?.created_at;
    if (!ds) return "PENDING";
    try {
      let cleanDs = ds;
      if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
        if (cleanDs.includes('T') || cleanDs.includes(':')) {
          const formatted = cleanDs.replace(' ', 'T');
          cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
        }
      }
      const date = new Date(cleanDs);
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

  /**
   * Converts any raw timestamp (UTC ISO string, or "YYYY-MM-DD HH:MM:SS IST" from the
   * staff dashboard user directory) to Indian Standard Time by adding +5:30, then formats
   * it as "MMM DD YYYY, HH:MM +5:30" for display in the application view page.
   */
  const formatStepDateTime = (ds?: string): string => {
    if (!ds) return "";
    try {
      let date: Date;

      // Handle "YYYY-MM-DD HH:MM:SS IST" strings stored in the user directory.
      // These already represent IST wall-clock time, so we parse them directly
      // as UTC (treating the IST wall-clock hours as-is) to avoid double-shifting.
      if (typeof ds === 'string' && ds.endsWith(' IST')) {
        const bare = ds.slice(0, ds.length - 4).trim(); // strip " IST"
        // bare is "YYYY-MM-DD HH:MM:SS" — treat as a plain datetime string
        date = new Date(bare.replace(' ', 'T') + 'Z'); // parse as UTC to preserve the stored IST wall-clock value
        // The stored wall-clock is already IST, so we format it directly
        const [datePart, timePart] = bare.split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm] = timePart.split(':');
        const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')} ${y}, ${hh}:${mm} +5:30`;
      }

      // All other timestamps are UTC ISO strings (e.g. "2026-05-23T04:23:00.000Z").
      // Add +5 hours 30 minutes to convert to Indian Standard Time.
      let cleanDs = ds;
      if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
        if (cleanDs.includes('T') || cleanDs.includes(':')) {
          const formatted = cleanDs.replace(' ', 'T');
          cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
        }
      }

      date = new Date(cleanDs);
      if (isNaN(date.getTime())) return "";

      // Use Intl.DateTimeFormat with Asia/Kolkata to correctly apply the +5:30 offset
      const ist = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date);

      const get = (type: string) => ist.find(p => p.type === type)?.value ?? '00';
      const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const monthIdx = parseInt(get('month'), 10) - 1;
      const monthStr = MONTHS[monthIdx] ?? 'JAN';
      const day = get('day');
      const year = get('year');
      const hr = get('hour');
      const min = get('minute');

      return `${monthStr} ${day} ${year}, ${hr}:${min}`;
    } catch {
      return "";
    }
  };

  // The primary user-directory timestamp — sourced from registeredAtIndia / createdAt
  // in the staff dashboard user record. Used as the authoritative time for stage timestamps.
  const userDirectoryTimestamp =
    application.date ||
    application.registeredAtIndia ||
    application.student?.registeredAtIndia ||
    application.user?.registeredAtIndia ||
    application.student?.createdAt ||
    application.student?.created_at ||
    application.user?.createdAt ||
    application.user?.created_at ||
    application.createdAt ||
    application.created_at;

  // Determine per-step timestamps from application data
  const appCreatedAt = userDirectoryTimestamp || application.submittedAt || application.submitted_at;
  const appUpdatedAt = application.updatedAt || application.updated_at || appCreatedAt;

  // Find the index of the last completed stage
  const completedThresholds = [10, 25, 40, 50, 75, 90, 95, 100];
  const lastCompletedIdx = completedThresholds.reduce((acc, threshold, idx) => progress >= threshold ? idx : acc, -1);

  const getStepStatus = (completed: boolean, active?: boolean) => {
    if (active) return "IN PROGRESS";
    return completed ? "COMPLETED" : "PENDING";
  };

  // All completed steps show a timestamp; we look up status history or use fallbacks
  const getStageTimestamp = (stageIdx: number, completed: boolean, active?: boolean): string | undefined => {
    if (!completed && !active) return undefined;

    // 1. Try to extract timestamps from fetchedStatusHistory or application.statusHistory
    const history = fetchedStatusHistory && fetchedStatusHistory.length > 0
      ? fetchedStatusHistory
      : (application.statusHistory || []);
    console.log('[DEBUG_TIMELINE] history used for timestamps:', history);

    const findHistoryTime = (statuses: string[]) => {
      const matches = history
        .filter((h: any) => statuses.includes(String(h.toStatus || h.to_status || h.status || h.toStage || h.to_stage || h.stage || "").toLowerCase()))
        .sort((a: any, b: any) => {
          const timeA = new Date(a.createdAt || a.created_at || a.timestamp || 0).getTime();
          const timeB = new Date(b.createdAt || b.created_at || b.timestamp || 0).getTime();
          return timeA - timeB;
        });
      if (matches.length > 0) {
        return matches[0].createdAt || matches[0].created_at || matches[0].timestamp;
      }
      return undefined;
    };

    const extractedTimestamps: (string | undefined)[] = [];
    for (let i = 0; i < 8; i++) {
      let time: string | undefined = undefined;
      switch (i) {
        case 0:
          time = findHistoryTime(['draft', 'pending', 'application_created']) || application.createdAt || application.date;
          break;
        case 1:
          time = findHistoryTime(['submitted', 'application_submitted', 'docs_received', 'docs_uploaded']) || application.submittedAt;
          break;
        case 2:
          time = findHistoryTime(['staff_verified', 'verification', 'documents_verified']) || application.verifiedAt;
          break;
        case 3:
          time = findHistoryTime(['submitted_to_bank', 'file_logged']) || application.fileLoggedAt || application.submittedToBankAt;
          break;
        case 4:
          time = findHistoryTime(['under_bank_review', 'query_raised', 'processing']) || application.reviewStartedAt || application.fileLoggedAt;
          break;
        case 5:
          time = findHistoryTime(['approved', 'sanctioned', 'conditional_sanction', 'counter_offer']) || application.approvedAt;
          break;
        case 6:
          time = findHistoryTime(['sanctioned', 'approved', 'sanction']) || application.sanctionDate || application.approvedAt;
          break;
        case 7:
          time = findHistoryTime(['disbursed', 'disbursement_confirmed', 'closed', 'disbursement']) || application.disbursedAt;
          break;
      }
      extractedTimestamps.push(time);
    }

    // Check if the history timestamps are valid
    if (extractedTimestamps[stageIdx]) {
      return extractedTimestamps[stageIdx];
    }

    // Fallbacks if history timestamp is missing
    if (stageIdx === 0 && appCreatedAt) return appCreatedAt;

    const getAnchorIdx = (p: number) => {
      if (p >= 100) return 7;
      if (p >= 95) return 7;
      if (p >= 90) return 6;
      if (p >= 75) return 5;
      if (p >= 50) return 4;
      if (p >= 40) return 3;
      if (p >= 25) return 2;
      if (p >= 10) return 1;
      return 0;
    };

    const anchorIdx = getAnchorIdx(progress);

    // If this is the active stage and we have an update time, use it
    if (active && stageIdx === anchorIdx && appUpdatedAt) {
      return appUpdatedAt;
    }

    // If this is a completed stage and it is the last completed stage
    if (completed && stageIdx === anchorIdx && appUpdatedAt) {
      return appUpdatedAt;
    }

    let startD = new Date(appCreatedAt);
    if (isNaN(startD.getTime())) startD = new Date();
    let endD = new Date(appUpdatedAt);
    if (isNaN(endD.getTime())) endD = new Date();

    if (startD.getTime() > endD.getTime()) {
      startD = new Date(endD.getTime() - 1000);
    }

    const span = endD.getTime() - startD.getTime();
    if (span > 0 && anchorIdx > 0) {
      // Linear interpolation fallback only if we absolutely have to
      const step = span / anchorIdx;
      return new Date(startD.getTime() + stageIdx * step).toISOString();
    } else {
      return new Date(endD.getTime() - (anchorIdx - stageIdx) * 60000).toISOString();
    }
  };

  const stages = [
    { label: "APPLICATION CREATED", icon: "bolt", date: getStepStatus(progress >= 10), completed: progress >= 10, timestamp: getStageTimestamp(0, progress >= 10) },
    { label: "APPLICATION SUBMITTED", icon: "send", date: getStepStatus(progress >= 25), completed: progress >= 25, timestamp: getStageTimestamp(1, progress >= 25) },
    { label: "DOCUMENTS VERIFICATION", icon: "verified", date: getStepStatus(progress >= 40), completed: progress >= 40, timestamp: getStageTimestamp(2, progress >= 40) },
    { label: "SUBMIT TO BANK", icon: "account_balance", date: getStepStatus(progress >= 50), completed: progress >= 50, timestamp: getStageTimestamp(3, progress >= 50) },
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

    let safeTimestamp = timestamp;
    if (!timestamp.endsWith('Z') && !timestamp.includes('+') && !timestamp.match(/-\d{2}:\d{2}$/)) {
      safeTimestamp = timestamp + 'Z';
    }

    const uploadedDate = new Date(safeTimestamp);
    if (Number.isNaN(uploadedDate.getTime())) return "Upload time unavailable";

    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(uploadedDate);

    const diffMs = Date.now() - uploadedDate.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

    let relative = "";
    if (diffMinutes < 1) relative = "just now";
    else if (diffMinutes < 60) relative = `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    else {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) relative = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) relative = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
        else {
          const diffWeeks = Math.floor(diffDays / 7);
          relative = `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
        }
      }
    }

    return `${formattedDate} (${relative})`;
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
  const loanAmount = Number(application.amount || application.loanAmount || application.student?.loanAmount || 0);
  const nameMatched = extractedName && fullName ? getComparableValue(extractedName).includes(getComparableValue(fullName)) || getComparableValue(fullName).includes(getComparableValue(extractedName)) : false;
  const dobMatched = extractedDob && application.dob ? getComparableValue(extractedDob) === getComparableValue(application.dob) : false;
  const hasCoapplicantPan = coApplicantOcrDocs.some((doc) => String(doc.docType || "").toLowerCase().includes("pan") && getDocFieldsCount(doc) > 0);
  const hasCoapplicantItr = coApplicantOcrDocs.some((doc) => String(doc.docType || "").toLowerCase().includes("itr") && getDocFieldsCount(doc) > 0);

  const examsList = (() => {
    const list: Array<{ name: string; score: string; maxScore?: number }> = [];

    const TEST_MAX_SCORES: Record<string, number> = {
      ielts: 9,
      toefl: 120,
      pte: 90,
      duolingo: 160,
      gre: 340,
      gmat: 800,
      sat: 1600,
      act: 36
    };

    const getMaxScore = (testName: string): number | undefined => {
      return TEST_MAX_SCORES[testName.toLowerCase()];
    };

    // 1. Check direct columns
    const englishTest = application.englishTest || application.user?.englishTest || application.student?.englishTest;
    const englishScore = application.englishScore || application.user?.englishScore || application.student?.englishScore;
    if (englishTest && englishScore) {
      list.push({
        name: String(englishTest).toUpperCase(),
        score: String(englishScore),
        maxScore: getMaxScore(String(englishTest))
      });
    }

    const entranceTest = application.entranceTest || application.user?.entranceTest || application.student?.entranceTest;
    const entranceScore = application.entranceScore || application.user?.entranceScore || application.student?.entranceScore;
    if (entranceTest && entranceScore) {
      list.push({
        name: String(entranceTest).toUpperCase(),
        score: String(entranceScore),
        maxScore: getMaxScore(String(entranceTest))
      });
    }

    // 2. Check tests JSON
    try {
      const testsStr = application.tests || application.user?.tests || application.student?.tests;
      if (testsStr) {
        const parsed = typeof testsStr === 'string' ? JSON.parse(testsStr) : testsStr;
        if (parsed && typeof parsed === 'object') {
          const testKeys = ['gre', 'gmat', 'sat', 'act', 'ielts', 'toefl', 'pte', 'duolingo'];
          testKeys.forEach(key => {
            if (parsed[key] && !list.some(e => e.name.toLowerCase() === key.toLowerCase())) {
              list.push({
                name: key.toUpperCase(),
                score: String(parsed[key]),
                maxScore: getMaxScore(key)
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("Failed to parse tests JSON:", e);
    }

    return list;
  })();

  // â”€â”€â”€ Cross-Document Discrepancy Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const panDoc = documents.find(d => String(d.docType || "").toLowerCase() === "pan");
  const panName = panDoc?.uploaded ? (panDoc.extractedData?.full_name || panDoc.extractedData?.name) : null;

  const passportDoc = documents.find(d => String(d.docType || "").toLowerCase() === "passport");
  const passportName = passportDoc?.uploaded ? (passportDoc.extractedData?.full_name || passportDoc.extractedData?.name) : null;

  const aadhaarDoc = documents.find(d => String(d.docType || "").toLowerCase() === "aadhaar");
  const aadhaarName = aadhaarDoc?.uploaded ? (aadhaarDoc.extractedData?.full_name || aadhaarDoc.extractedData?.name) : null;

  let crossDocNameMismatch = false;
  let crossDocNameDetail = "";
  let discrepantDocs: { doc1: OcrSummaryDoc, doc2: OcrSummaryDoc } | null = null;

  if (panName && passportName && getComparableValue(panName) !== getComparableValue(passportName)) {
    crossDocNameMismatch = true;
    crossDocNameDetail = `PAN Name ("${panName}") mismatches Passport Name ("${passportName}").`;
    if (panDoc && passportDoc) discrepantDocs = { doc1: panDoc, doc2: passportDoc };
  } else if (panName && aadhaarName && getComparableValue(panName) !== getComparableValue(aadhaarName)) {
    crossDocNameMismatch = true;
    crossDocNameDetail = `PAN Name ("${panName}") mismatches Aadhaar Name ("${aadhaarName}").`;
    if (panDoc && aadhaarDoc) discrepantDocs = { doc1: panDoc, doc2: aadhaarDoc };
  } else if (passportName && aadhaarName && getComparableValue(passportName) !== getComparableValue(aadhaarName)) {
    crossDocNameMismatch = true;
    crossDocNameDetail = `Passport Name ("${passportName}") mismatches Aadhaar Name ("${aadhaarName}").`;
    if (passportDoc && aadhaarDoc) discrepantDocs = { doc1: passportDoc, doc2: aadhaarDoc };
  }

  const validationChecks: ValidationCheck[] = [
    {
      label: "Name match across uploaded documents",
      detail: crossDocNameMismatch
        ? crossDocNameDetail
        : nameMatched
          ? `${fullName} verified from OCR data`
          : extractedName
            ? `${String(extractedName)} needs profile review`
            : "Waiting for extracted name data",
      status: crossDocNameMismatch ? "error" : nameMatched ? "success" : extractedName ? "warning" : "pending",
      onReview: crossDocNameMismatch && discrepantDocs ? () => setActiveDiscrepancy(discrepantDocs) : undefined,
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
    <div className={`staff-dashboard-body fixed inset-y-0 right-0 z-[40] flex flex-col bg-[#F8FAFC] overflow-hidden animate-in fade-in duration-500 transition-all duration-300 ${sidebarOpen ? 'lg:left-[280px] left-0' : 'lg:left-[68px] left-0'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @media print {
          /* Hide all non-printable elements */
          .no-print,
          aside,
          header,
          button,
          .material-symbols-outlined,
          iframe {
            display: none !important;
          }

          /* Hide background ambient glows */
          .bg-indigo-50\\/50, .bg-emerald-50\\/50, .blur-\\[120px\\], .blur-\\[100px\\], .blur-3xl {
            display: none !important;
          }

          /* Reset scroll & height limits for full page pagination */
          html, body, #__next, [data-reactroot], .staff-dashboard-shell {
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
          }

          /* Force detail container to occupy full width and flow naturally */
          .staff-dashboard-body {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            z-index: auto !important;
          }

          /* Reset layout flex wrappers so content flows vertically across pages */
          .flex, .flex-1, .grid, main {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Remove visual noise and box shadows */
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-inner {
            box-shadow: none !important;
            border-color: #e2e8f0 !important;
          }

          /* Fix background colors for clean paper printing */
          .bg-white\\/70, .bg-slate-50\\/60, .bg-white\\/40, .bg-slate-50\\/50, .bg-slate-50 {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
          }

          /* Avoid page breaks inside important cards */
          .group, .rounded-3xl, .rounded-\\[40px\\], .border, .p-10, .p-8 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure text colors are high contrast */
          .text-slate-400, .text-slate-500, .text-slate-600 {
            color: #475569 !important;
          }
          .text-slate-900, .text-slate-800 {
            color: #000000 !important;
          }

          /* Force page margins */
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
        }
      `}</style>
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-emerald-50/50 blur-[100px] rounded-full -z-10" />

      {/* Top Navbar */}
      <div className="h-[56px] no-print bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">VIdyaLoans</p>
          <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">Application Detail</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* <div className="relative group mr-2">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search applications, students, IDs..."
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white w-64 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm focus:shadow-md"
            />
          </div> */}

          <div className="h-5 w-px bg-slate-200"></div>

          <div className="flex items-center gap-3">
            {/* Real-time Sync Timer */}
            <div className="hidden lg:flex items-center gap-4 border-r border-slate-200 pr-4">
              <div className="flex items-center gap-1.5 text-[14px] text-black font-bold uppercase tracking-widest font-mono">
                <span>Sync: {format(nowTime, 'MMM dd, HH:mm:ss')}</span>
              </div>
            </div>

            {/* Menu Toggle */}
            {/* {setSidebarOpen && (
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>
            )} */}

            {/* Notifications Panel */}
            {user?.id ? (
              <NotificationsPanel
                staffId={user.id}
                maxDisplay={8}
                showUnreadBadge={true}
              />
            ) : (
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              </button>
            )}

            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <img
                src={user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : "https://api.dicebear.com/7.x/avataaars/svg?seed=Staff"}
                alt="Avatar"
                className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 object-cover"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-[12px] font-semibold text-slate-800 leading-none">
                  {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName[0] + '.' : ''}` : 'Staff Member'}
                </span>
                <span className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">
                  {user?.role?.replace('_', ' ') || 'Level 4 Admin'}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            {logout && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Secondary Left Menu */}
        <div className="w-[120px] no-print bg-white/60 backdrop-blur-xl border-r border-slate-100/50 flex flex-col py-8 px-4 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="space-y-4">
            {[
              { id: 'application_details', label: 'Application\ndetails', icon: 'description' },
              { id: 'student', label: 'Student', icon: 'person' },
              { id: 'exams', label: 'Exams', icon: 'school' },
              { id: 'bankdecisions', label: 'Bank\ndecisions', icon: 'account_balance' },
            ].map(menu => (
              <button
                key={menu.id}
                onClick={() => setActiveSidebarMenu(menu.id)}
                className={`w-full flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all group ${activeSidebarMenu === menu.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
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
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {activeSidebarMenu === 'application_details' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">

              {/* Breadcrumb / Back Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <button
                    onClick={onBack}
                    className="w-12 h-12 no-print rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                      <span className="material-symbols-outlined text-[20px]">account_balance</span>
                    </div>
                    <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Education Loan Terminal</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3 no-print">
                  <button
                    onClick={() => {
                      setActiveSidebarMenu("application_details");
                      setTimeout(() => window.print(), 300);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <span className="material-symbols-outlined text-[17px]">print</span>
                    Export PDF
                  </button>

                  <button
                    onClick={() => {
                      setActiveSidebarMenu("application_details");
                      setActiveTab("notes");
                      setTimeout(() => {
                        const notesSection = document.getElementById("internal-notes-section");
                        if (scrollContainerRef.current && notesSection) {
                          const container = scrollContainerRef.current;
                          const containerRect = container.getBoundingClientRect();
                          const elemRect = notesSection.getBoundingClientRect();
                          const relativeTop = elemRect.top - containerRect.top + container.scrollTop;
                          container.scrollTo({ top: relativeTop - 20, behavior: 'smooth' });
                        } else {
                          notesSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[17px]">sticky_note_2</span>
                    Internal Notes
                  </button>

                  <button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-md shadow-indigo-600/10"
                  >
                    <span className="material-symbols-outlined text-[17px]">mail</span>
                    Send Email
                  </button>
                </div>
              </div>

              {/* Bank Routing Banner */}
              {/* {application.status === "submitted" && (
                <div className="bg-gradient-to-r from-blue-900/90 to-indigo-950/90 backdrop-blur-md rounded-3xl p-8 border border-indigo-800/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-950/10 animate-in slide-in-from-top-6 duration-500">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                      <span className="material-symbols-outlined text-[28px] animate-pulse">rocket_launch</span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-white tracking-tight">Ready for Bank Submission</h3>
                      <p className="text-[13px] text-indigo-200/80 mt-0.5 font-medium">All initial documents have been submitted. Review document statuses and route this application to a partner bank.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-indigo-600/30 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send to Bank
                  </button>
                </div>
              )} */}

              {/* Main Info Card - Glassmorphism & Rich Styling */}
              <div className="bg-white/70 backdrop-blur-sm rounded-[40px] p-10 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full blur-3xl -z-10 group-hover:bg-emerald-100/40 transition-colors duration-1000" />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative z-10">
                  <div className="flex flex-col md:flex-row gap-6 min-w-0 flex-1">
                    {/* Bank Logo Area */}
                    <div className="w-24 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-sm border border-slate-50 group-hover:shadow-md transition-all duration-500">
                      {getBankLogo() ? (
                        <img src={getBankLogo()!} alt="Bank" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-[32px]">account_balance</span>
                      )}
                    </div>

                    <div className="space-y-6 flex-1 min-w-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <p
                            onClick={() => setActiveSidebarMenu("student")}
                            className="text-[11px] font-['Playfair_Display',serif] font-black text-slate-400 uppercase tracking-[0.25em] cursor-pointer hover:text-emerald-600 hover:underline transition-all"
                            title="Click to view Student Profile"
                          >
                            UNIVERSITY OF {(application.universityName || application.college || "TORONTO").toUpperCase()}
                          </p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-widest uppercase shadow-sm ${['PENDING', 'UNDER REVIEW', 'IN PROGRESS'].includes(status)
                            ? 'bg-amber-50 text-amber-600 border-amber-100/50'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                            }`}>{status}</span>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                          <h3
                            onClick={() => setActiveSidebarMenu("student")}
                            className="text-[30px] font-black text-slate-900 tracking-tight leading-tight cursor-pointer hover:text-emerald-600 hover:underline transition-all"
                            title="Click to view Student Profile"
                          >
                            {application.firstName || application.student?.firstName || "Abhi"} {application.lastName || application.student?.lastName || "Y"}
                          </h3>
                          <p
                            onClick={() => setActiveSidebarMenu("student")}
                            className="text-[18px] font-bold text-emerald-600/90 cursor-pointer hover:text-emerald-500 hover:underline transition-all"
                            title="Click to view Student Profile"
                          >
                            {application.courseName || application.program || "MS/M.Tech"}
                          </p>
                        </div>
                      </div>

                      {/* Condensed 2x2 grid */}
                      <div className="grid grid-cols-2 gap-4 max-w-xl bg-slate-50/60 p-5 rounded-3xl border border-slate-100/80">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">APPLICATION ID</p>
                          <p className="text-[12px] font-bold text-slate-700 font-mono truncate">{appId}</p>
                        </div>
                        <div className="space-y-0.5 col-span-2 sm:col-span-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UNIVERSITY</p>
                          <p
                            onClick={() => setActiveSidebarMenu("student")}
                            className="text-[12px] font-bold text-slate-700 truncate cursor-pointer hover:text-emerald-600 hover:underline transition-all"
                            title="Click to view Student Profile"
                          >
                            {(application.universityName || application.college || "TORONTO").toUpperCase()}
                          </p>
                        </div>
                        <div className="space-y-0.5 col-span-2 sm:col-span-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">COURSE CATEGORY</p>
                          <p className="text-[12px] font-bold text-slate-700 truncate">{application.courseLevel || "POSTGRADUATE ABROAD"}</p>
                        </div>
                        <div className="space-y-0.5 col-span-2 sm:col-span-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DESTINATION</p>
                          <p className="text-[12px] font-bold text-slate-700 uppercase truncate">
                            {resolveDestination(application)}
                          </p>
                        </div>
                        <div className="space-y-0.5 col-span-2 sm:col-span-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">INTAKE</p>
                          <p className="text-[12px] font-bold text-slate-700 truncate">
                            {resolveIntake(application)}
                          </p>
                        </div>
                        {(application.bank || application.targetBank) && (
                          <div className="space-y-0.5 col-span-2 sm:col-span-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LAN NUMBER</p>
                            <p className="text-[12px] font-bold text-slate-700 truncate">
                              {application.lanNumber || "PENDING"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-8 shrink-0">
                    {/* Amount Prominence - Subtle, high-contrast dedicated block */}
                    <div className="bg-emerald-950 border border-emerald-900 rounded-3xl p-5 text-left shadow-lg shadow-emerald-950/10 min-w-[200px]">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">LOAN AMOUNT APPLIED</p>
                      <div className="flex items-baseline gap-1">
                        {/* <span className="text-[20px] font-bold text-emerald-400">â‚¹</span> */}
                        <span className="text-[32px] font-black text-white tracking-tight leading-none">
                          {formatAmountInINR(Number(application.amount || application.loanAmount || application.student?.loanAmount || 3999999))}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">PROGRESS QUOTA</p>
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            className="text-slate-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            className="text-emerald-600 transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 48}
                            strokeDashoffset={2 * Math.PI * 48 - (2 * Math.PI * 48 * progress) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{progress}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">%</span>
                        </div>
                      </div>
                      <div className="mt-3.5 flex items-center gap-1.5 text-black">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        <p className="text-[9px] font-black uppercase tracking-widest tabular-nums text-black">
                          Updated: {formatStepDateTime(progress <= 10 ? (application.student?.registeredAtIndia || application.registeredAtIndia || application.student?.createdAt || application.student?.created_at || application.user?.createdAt || application.user?.created_at || appUpdatedAt || appCreatedAt) : (appUpdatedAt || appCreatedAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Timeline - Clean & Dynamic */}
              <div className="mt-12 bg-white/40 backdrop-blur-sm border border-slate-100 rounded-3xl p-8 overflow-x-auto no-scrollbar">
                <div className="relative px-6 min-w-[1100px]">
                  <div className="absolute top-[18px] left-16 right-16 h-[4px] bg-slate-100 rounded-full" />
                  <div className="absolute top-[18px] left-16 h-[4px] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `calc(${(stages.filter(s => s.completed).length - 1) / (stages.length - 1) * 100}% - 64px)` }} />

                  <div className="flex justify-between relative z-10">
                    {stages.map((stage, idx) => (
                      <div key={idx} className="w-36 px-2 flex flex-col items-center group/stage shrink-0">
                        <div className={`w-10 h-10 rounded-full border-[5px] border-white shadow-lg flex items-center justify-center transition-all duration-500 group-hover/stage:scale-110 ${stage.completed ? (stage.active ? 'bg-emerald-500 shadow-emerald-200' : 'bg-emerald-600 shadow-emerald-100') : 'bg-slate-200 shadow-none'}`}>
                          {stage.completed ? (
                            <span className="material-symbols-outlined text-white text-[18px] font-black">check</span>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
                          )}
                        </div>
                        <div className="mt-4 text-center">
                          <p className={`text-[14px] font-extrabold tracking-wide uppercase transition-colors whitespace-pre-line leading-tight ${stage.active ? 'text-emerald-600' : stage.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                            {formatStepLabel(stage.label)}
                          </p>
                          {stage.timestamp && (
                            <p className="mt-2 text-[12px] font-bold tabular-nums tracking-wide text-black">
                              {formatStepDateTime(stage.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Hub & Sticky Tabs Section */}
              <div id="action-hub-section" className="space-y-8 animate-in slide-in-from-bottom-10 duration-700 delay-200">
                <div className="sticky top-0 no-print bg-[#F8FAFC]/95 backdrop-blur-md z-[50] py-4 border-b border-slate-200 flex items-center justify-between px-6 -mx-6 shadow-sm">
                  <div className="flex items-center gap-10">
                    {[
                      { id: "requirements", label: "REQUIREMENTS", icon: "task_alt" },
                      // { id: "records", label: "STUDENT RECORDS", icon: "folder_shared" },
                      { id: "notes", label: "INTERNAL NOTES", icon: "sticky_note_2" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-1 flex items-center gap-2.5 text-[13px] font-black tracking-[0.1em] uppercase relative transition-all group ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <span className={`material-symbols-outlined text-[18px] transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-300'}`}>{tab.icon}</span>
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-[-17px] left-0 right-0 h-[3px] bg-emerald-600 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                    >
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
                        onVerifyDocument={handleVerifyDocument}
                        onRejectDocument={handleRejectDocument}
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
                        onDownloadDocument={handleDownloadDocument}
                        onSendToBank={(doc) => setSendToBankDoc(doc)}
                        crossDocNameMismatch={crossDocNameMismatch}
                        dobMatched={dobMatched}
                        extractedDob={String(extractedDob || "")}
                        application={application}
                        handleSyncField={handleSyncField}
                        isSyncing={isSyncing}
                        fullName={fullName}
                        extractedName={String(extractedName || "")}
                        panDoc={panDoc}
                        passportDoc={passportDoc}
                        aadhaarDoc={aadhaarDoc}
                        panName={panName ? String(panName) : null}
                        passportName={passportName ? String(passportName) : null}
                        aadhaarName={aadhaarName ? String(aadhaarName) : null}
                        getComparableValue={getComparableValue}
                      />
                    )}

                    {activeTab === "kyc" && (
                      <KycSystemDashboard
                        userId={userId}
                        application={application}
                        onRefresh={fetchDocuments}
                        onAadhaarSaved={onAadhaarSaved}
                      />
                    )}

                    {/* {activeTab === "records" && (
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
                                  <div className={`max-w-[80%] px-6 py-4 rounded-t-3xl shadow-lg ${msg.sender === "staff"
                                    ? "bg-indigo-600 text-white rounded-bl-3xl shadow-indigo-100"
                                    : msg.sender === "bank"
                                      ? "bg-amber-50 border border-amber-105 text-slate-705 rounded-br-3xl shadow-sm"
                                      : "bg-white border border-slate-100 text-slate-707 rounded-br-3xl shadow-sm"
                                    }`}>
                                    <p className="text-[14px] leading-relaxed">{msg.text}</p>
                                  </div>
                                  <p className={`text-[10px] font-bold text-black ${msg.sender === "staff" ? "mr-2" : "ml-2"}`}>
                                    {msg.sender === "staff" ? "STAFF" : msg.sender === "bank" ? "BANK" : "STUDENT"} • {msg.time}
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
                    )} */}

                    {activeTab === "notes" && (
                      <div id="internal-notes-section" className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
                              <span className="material-symbols-outlined text-[22px]">sticky_note_2</span>
                            </div>
                            <div>
                              <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Internal Staff Notes</h3>
                              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Confidential staff only</p>
                            </div>
                          </div>
                          <button onClick={handleAddNote} className="flex items-center gap-2 px-5 py-2.5 bg-[#0d1b2a] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Note
                          </button>
                        </div>
                        <div className="space-y-4">
                          {notes.map((note, idx) => (
                            <div key={note.id || note._id || idx} className="p-6 rounded-3xl bg-slate-50/80 border border-slate-100 hover:border-amber-200 transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <p className="text-[12px] font-black text-slate-900">
                                  {note.authorName || note.author || 'Staff Member'}{" "}
                                  <span className="font-medium text-slate-400 ml-2">{note.role}</span>
                                </p>
                                <p className="text-[10px] font-bold text-black uppercase">
                                  {note.createdAt ? formatNoteTime(note.createdAt) : (note.time || 'JUST NOW')}
                                </p>
                              </div>
                              <p className="text-[14px] text-slate-600 leading-relaxed">{note.content || note.text}</p>
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
                    <p className="text-[11px] font-bold text-black uppercase tracking-widest mt-1">Registered: {createdDateIST}</p>
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
                          <p className="text-[14px] font-semibold text-slate-900">{application.firstName || application.user?.firstName || application.student?.firstName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Name</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.lastName || application.user?.lastName || application.student?.lastName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                          <p className="text-[14px] font-semibold text-slate-900">{String(application.dob || application.user?.dateOfBirth || application.student?.dob || "—").split('T')[0]}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.email || application.user?.email || application.student?.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.phone || application.user?.phoneNumber || application.student?.phone || application.mobile || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gender</p>
                          <p className="text-[14px] font-semibold text-slate-900">{application.gender || application.user?.gender || application.student?.gender || "—"}</p>
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
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pincode</p>
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
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Study Destination</p>
                          <p className="text-[14px] font-semibold text-slate-900 uppercase">{resolveDestination(application)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Intake</p>
                          <p className="text-[14px] font-semibold text-slate-900">{resolveIntake(application)}</p>
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

          {activeSidebarMenu === 'exams' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-5">
                <button
                  onClick={onBack}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Standardized Test Scores</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Academic & Language Competency</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-[40px] p-10 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative">
                {examsList.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-4xl text-slate-300">school</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Test Scores Registered</h3>
                    <p className="text-sm text-slate-400 mt-2">The applicant has not registered any standardized test scores (GRE, GMAT, IELTS, TOEFL, PTE) for this profile.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {examsList.map((exam, index) => (
                      <div key={index} className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-xl -z-10 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100/50 shadow-sm">
                            <span className="material-symbols-outlined text-[24px]">grade</span>
                          </div>
                          <div>
                            <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">{exam.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Score</p>
                          </div>
                        </div>
                        <div className="mt-6 flex items-baseline gap-2">
                          <span className="text-[36px] font-black text-[#0d1b2a] tracking-tight leading-none">{exam.score}</span>
                          {exam.maxScore && (
                            <span className="text-[18px] font-bold text-slate-400">/ {exam.maxScore}</span>
                          )}
                          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded ml-auto">Verified</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSidebarMenu === 'bankdecisions' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
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
                  <div>
                    <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Bank Decisions & Queries</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lender Audits, Decisions and Verification Queries</p>
                  </div>
                </div>
              </div>

              {/* Status / Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">info</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Status</p>
                    <p className="text-[18px] font-extrabold text-slate-900 mt-1 uppercase">
                      {application.status || 'PENDING'}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">gavel</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Decisions Logged</p>
                    <p className="text-[24px] font-black text-slate-900 mt-0.5">
                      {loadingBankData ? '...' : bankDecisions.length}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">help_center</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Queries</p>
                    <p className="text-[24px] font-black text-slate-900 mt-0.5">
                      {loadingBankData ? '...' : bankQueries.filter(q => q.status === 'open' || q.status === 'OPEN').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Queries Column (Left) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[22px] text-sky-600">question_answer</span>
                        <h3 className="text-[18px] font-bold text-[#0d1b2a] font-['Playfair_Display',serif]">Bank Queries & Clarifications</h3>
                      </div>
                      {loadingBankData && (
                        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                      )}
                    </div>

                    {bankQueries.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="material-symbols-outlined text-3xl text-slate-300">chat_bubble_outline</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800">No Queries Raised Yet</h4>
                        <p className="text-xs text-slate-400 mt-1">This application has no active clarification queries from partner banks.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bankQueries.map((query, index) => {
                          const isOpen = query.status === 'open' || query.status === 'OPEN';
                          return (
                            <div key={query.id || index} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col gap-3 relative overflow-hidden group">
                              {isOpen && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse" />
                              )}
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isOpen 
                                      ? 'bg-amber-55 text-amber-700 border border-amber-100' 
                                      : 'bg-emerald-55 text-emerald-700 border border-emerald-100'
                                  }`}>
                                    {isOpen ? 'Open' : 'Resolved'}
                                  </span>
                                  {query.queryType && (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                                      {query.queryType}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {query.createdAt || query.timestamp ? formatIST(query.createdAt || query.timestamp, true) : 'N/A'}
                                </span>
                              </div>
                              <p className="text-[14px] text-slate-700 font-medium leading-relaxed mt-1">
                                {query.content}
                              </p>
                              <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200/50 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>Raised By: {query.authorName || query.raisedBy || 'Bank Officer'}</span>
                                {query.resolvedAt && (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                                    Resolved: {formatIST(query.resolvedAt, false)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Decisions Column (Right) */}
                <div className="space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[22px] text-emerald-600">verified</span>
                        <h3 className="text-[18px] font-bold text-[#0d1b2a] font-['Playfair_Display',serif]">Bank Decisions</h3>
                      </div>
                    </div>

                    {bankDecisions.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="material-symbols-outlined text-3xl text-slate-300">gavel</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800">No Decisions Logged</h4>
                        <p className="text-xs text-slate-400 mt-1">No formal underwriting decisions have been registered for this file yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {bankDecisions.map((dec, index) => {
                          const decType = String(dec.decision).toUpperCase();
                          let style = {
                            badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
                            border: 'border-slate-200',
                            title: 'Decision Logged'
                          };
                          if (decType === 'APPROVED' || decType === 'SANCTIONED') {
                            style = { badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100', border: 'border-emerald-100', title: 'Loan Sanctioned' };
                          } else if (decType === 'CONDITIONAL_SANCTION' || decType === 'CONDITIONAL') {
                            style = { badgeBg: 'bg-amber-50 text-amber-700 border-amber-100', border: 'border-amber-100', title: 'Conditional Sanction' };
                          } else if (decType === 'COUNTER_OFFER') {
                            style = { badgeBg: 'bg-violet-50 text-violet-700 border-violet-100', border: 'border-violet-100', title: 'Counter Offer Proposed' };
                          } else if (decType === 'REJECTED') {
                            style = { badgeBg: 'bg-rose-50 text-rose-700 border-rose-100', border: 'border-rose-100', title: 'Application Rejected' };
                          } else if (decType === 'PARTIAL_SANCTION') {
                            style = { badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-100', border: 'border-cyan-100', title: 'Partial Sanction Approved' };
                          }

                          let condList: { text: string; status?: string; deadline?: string }[] = [];
                          try {
                            if (dec.conditions) {
                              const parsed = typeof dec.conditions === 'string' ? JSON.parse(dec.conditions) : dec.conditions;
                              if (Array.isArray(parsed)) {
                                condList = parsed.map(c => {
                                  if (typeof c === 'string') {
                                    return { text: c, status: 'PENDING' };
                                  }
                                  return { text: c.text || '', status: c.status || 'PENDING', deadline: c.deadline };
                                });
                              }
                            }
                          } catch(e) {}

                          let counterTerms: any = null;
                          try {
                            if (dec.counterOffer) {
                              counterTerms = typeof dec.counterOffer === 'string' ? JSON.parse(dec.counterOffer) : dec.counterOffer;
                            } else if (dec.counterOfferTerms) {
                              counterTerms = typeof dec.counterOfferTerms === 'string' ? JSON.parse(dec.counterOfferTerms) : dec.counterOfferTerms;
                            }
                          } catch(e) {}

                          return (
                            <div key={dec.id || index} className={`p-5 rounded-2xl border ${style.border} bg-white transition-all flex flex-col gap-3 relative shadow-sm group hover:shadow-md`}>
                              <div className="flex justify-between items-start">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.badgeBg}`}>
                                  {decType.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {dec.decidedAt ? formatIST(dec.decidedAt, false) : 'N/A'}
                                </span>
                              </div>

                              <h4 className="text-[14px] font-extrabold text-slate-900 mt-1">{style.title}</h4>

                              {/* Decision specifics details */}
                              <div className="space-y-1.5 text-[12px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                {dec.sanctionAmount && decType !== 'COUNTER_OFFER' && (
                                  <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Sanction Amount:</span>
                                    <span className="font-extrabold text-slate-900">₹{Number(dec.sanctionAmount).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {dec.requestedAmount && (
                                  <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Requested Amount:</span>
                                    <span className="font-extrabold text-slate-900">₹{Number(dec.requestedAmount).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {dec.shortfallAmount && (
                                  <div className="flex justify-between text-rose-600 bg-rose-50/50 px-2.5 py-1 rounded-lg border border-rose-100/50 mt-1">
                                    <span className="font-semibold">Shortfall Amount:</span>
                                    <span className="font-extrabold">₹{Number(dec.shortfallAmount).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {dec.interestRate && decType !== 'COUNTER_OFFER' && (
                                  <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Interest Rate:</span>
                                    <span className="font-extrabold text-slate-900">{dec.interestRate}% {dec.roiType ? `(${dec.roiType.toLowerCase()})` : ''}</span>
                                  </div>
                                )}
                                {dec.tenure && decType !== 'COUNTER_OFFER' && (
                                  <div className="flex justify-between">
                                    <span className="font-medium text-slate-400">Tenure:</span>
                                    <span className="font-extrabold text-slate-900">{dec.tenure} Months</span>
                                  </div>
                                )}
                                {dec.rejectionCategory && (
                                  <div className="flex justify-between border-t border-slate-200/50 pt-1.5 mt-1">
                                    <span className="font-medium text-rose-500">Rejection Category:</span>
                                    <span className="font-extrabold text-rose-700 uppercase text-[10px] tracking-wider">{dec.rejectionCategory.replace(/_/g, ' ')}</span>
                                  </div>
                                )}
                                {dec.rejectionReason && (
                                  <div className="flex flex-col gap-1 mt-1 border-t border-slate-200/50 pt-1.5">
                                    <span className="font-medium text-rose-500">Rejection Reason:</span>
                                    <span className="font-semibold text-slate-700">{dec.rejectionReason}</span>
                                  </div>
                                )}
                              </div>

                              {/* Counter Offer Specifics */}
                              {counterTerms && (
                                <div className="space-y-2 mt-1">
                                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Proposed Counter Terms:</p>
                                  <div className="space-y-1.5 text-[12px] text-slate-600 bg-violet-50/50 p-3.5 rounded-xl border border-violet-100">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-violet-700">Offered Amount:</span>
                                      <span className="font-extrabold text-slate-900">₹{Number(counterTerms.offeredAmount || counterTerms.sanctionAmount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium text-violet-700">Offered ROI:</span>
                                      <span className="font-extrabold text-slate-900">{counterTerms.offeredRate || counterTerms.interestRate || counterTerms.roiEffective || '—'}% {counterTerms.roiType ? `(${counterTerms.roiType.toLowerCase()})` : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium text-violet-700">Offered Tenure:</span>
                                      <span className="font-extrabold text-slate-900">{counterTerms.offeredTenure || counterTerms.tenure || '—'} Months</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Conditions checklist */}
                              {condList.length > 0 && (
                                <div className="space-y-2 mt-1">
                                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Sanction Conditions:</p>
                                  <ul className="space-y-1">
                                    {condList.map((cond, cIdx) => (
                                      <li key={cIdx} className="text-[11px] text-slate-600 flex items-center justify-between gap-1.5 leading-relaxed bg-amber-50/30 px-3 py-2 rounded-xl border border-amber-100/50">
                                        <div className="flex items-start gap-1.5">
                                          <span className="material-symbols-outlined text-[13px] text-amber-500 mt-0.5 flex-shrink-0">warning</span>
                                          <span className="font-medium">{cond.text}</span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${cond.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                          {cond.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                  {dec.conditionDeadline && (
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                      Deadline: {formatIST(dec.conditionDeadline, false)}
                                    </p>
                                  )}
                                </div>
                              )}

                              {dec.remarks && (
                                <p className="text-[12px] text-slate-500 italic mt-1 font-medium bg-slate-50/50 p-2.5 rounded border border-dashed border-slate-200">
                                  "{dec.remarks}"
                                </p>
                              )}

                              {dec.sanctionLetterUrl && (
                                <a 
                                  href={dec.sanctionLetterUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mt-2 text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 uppercase tracking-wider"
                                >
                                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                  Download Sanction Letter
                                </a>
                              )}

                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 pt-2 border-t border-slate-100 flex justify-between">
                                <span>Decided By: {dec.decidedBy || 'Bank System'}</span>
                                <span>Bank: {dec.bankId?.toUpperCase()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Modals & Sub-components */}
      {
        isAddDocModalOpen && (
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
        )
      }

      {
        selectedDocPreview && (
          <DocumentPreviewDrawer
            doc={selectedDocPreview}
            userId={userId}
            title={formatDocTitle(selectedDocPreview)}
            uploadAge={formatUploadAge(selectedDocPreview.uploadedAt)}
            onClose={() => setSelectedDocPreview(null)}
          />
        )
      }

      {
        activeDiscrepancy && (
          <SideBySideComparisonModal
            doc1={activeDiscrepancy.doc1}
            doc2={activeDiscrepancy.doc2}
            userId={userId}
            onClose={() => setActiveDiscrepancy(null)}
          />
        )
      }

      {/* OCR Sync Modal */}
      {
        isSyncModalOpen && selectedDocForSync && (
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
        )
      }

      {/* Share with Bank Modal */}
      <ShareWithBankModal
        applicationId={application.id || application._id}
        applicationNumber={appId}
        studentName={fullName}
        loanAmount={Number(application.amount || application.loanAmount || application.student?.loanAmount || 0)}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSuccess={() => {
          if (onApplicationUpdated) {
            onApplicationUpdated();
          }
          onBack();
        }}
      />

      {/* Send Individual Document to Bank Modal */}
      {sendToBankDoc && (
        <SendDocumentToBankModal
          isOpen={!!sendToBankDoc}
          onClose={() => setSendToBankDoc(null)}
          userId={userId}
          docType={sendToBankDoc.docType}
          docTitle={formatDocTitle(sendToBankDoc)}
          studentName={fullName}
          applicationNumber={appId}
          onSuccess={() => setSendToBankDoc(null)}
        />
      )}

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        recipientEmail={application.email || application.student?.email || ""}
        recipientName={fullName}
      />
    </div >
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
  onDownloadDocument,
  onSendToBank,
  crossDocNameMismatch,
  dobMatched,
  extractedDob,
  application,
  handleSyncField,
  isSyncing,
  fullName,
  extractedName,
  panDoc,
  passportDoc,
  aadhaarDoc,
  panName,
  passportName,
  aadhaarName,
  getComparableValue,
  onVerifyDocument,
  onRejectDocument,
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
  onDownloadDocument?: (doc: OcrSummaryDoc) => void;
  onSendToBank?: (doc: OcrSummaryDoc) => void;
  crossDocNameMismatch: boolean;
  dobMatched: boolean;
  extractedDob: string;
  application: any;
  handleSyncField: (field: string, value: any) => Promise<void>;
  isSyncing: boolean;
  fullName: string;
  extractedName: string;
  panDoc?: OcrSummaryDoc;
  passportDoc?: OcrSummaryDoc;
  aadhaarDoc?: OcrSummaryDoc;
  panName: string | null;
  passportName: string | null;
  aadhaarName: string | null;
  getComparableValue: (val: any) => string;
  onVerifyDocument?: (docId: string) => void;
  onRejectDocument?: (docId: string, reason: string) => void;
}) => {
  const [docSubTab, setDocSubTab] = useState<"action" | "completed" | "rejected">("action");

  const isRejected = (doc: OcrSummaryDoc) => {
    return String(doc.status || "").toLowerCase() === "rejected";
  };

  const isActionRequired = (doc: OcrSummaryDoc) => {
    if (isRejected(doc)) return false;
    if (!doc.uploaded) return true;
    const confidence = normalizeConfidence(doc.accuracy);
    if (confidence < 75) return true;
    const typeLower = String(doc.docType || "").toLowerCase();
    if (typeLower === "pan" && panName && getComparableValue(panName) !== getComparableValue(fullName)) return true;
    if (typeLower === "passport" && passportName && getComparableValue(passportName) !== getComparableValue(fullName)) return true;
    if (typeLower === "aadhaar" && aadhaarName && getComparableValue(aadhaarName) !== getComparableValue(fullName)) return true;
    if (typeLower === "aadhaar" && extractedDob && !dobMatched) return true;
    if (typeLower === "passport" && extractedDob && !dobMatched) return true;
    return false;
  };

  const rejectedAcademic = academicDocs.filter(isRejected);
  const rejectedCoApplicant = coApplicantDocs.filter(isRejected);

  const actionRequiredAcademic = academicDocs.filter(isActionRequired);
  const actionRequiredCoApplicant = coApplicantDocs.filter(isActionRequired);

  const completedAcademic = academicDocs.filter((d) => !isRejected(d) && !isActionRequired(d));
  const completedCoApplicant = coApplicantDocs.filter((d) => !isRejected(d) && !isActionRequired(d));

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-tabs for checklists */}
      <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/50">
        <button
          onClick={() => setDocSubTab("action")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all ${docSubTab === "action"
            ? "bg-white text-rose-600 shadow-sm border border-rose-100"
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <span className="material-symbols-outlined text-[16px] text-rose-500">warning</span>
          Action Required ({actionRequiredAcademic.length + actionRequiredCoApplicant.length})
        </button>
        <button
          onClick={() => setDocSubTab("rejected")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all ${docSubTab === "rejected"
            ? "bg-white text-red-600 shadow-sm border border-red-100"
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <span className="material-symbols-outlined text-[16px] text-red-500">cancel</span>
          Rejected ({rejectedAcademic.length + rejectedCoApplicant.length})
        </button>
        <button
          onClick={() => setDocSubTab("completed")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all ${docSubTab === "completed"
            ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
          Verified / Completed ({completedAcademic.length + completedCoApplicant.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OcrDocumentGroup
          title="Applicant Documents"
          icon="school"
          docs={
            docSubTab === "action"
              ? actionRequiredAcademic
              : docSubTab === "rejected"
                ? rejectedAcademic
                : completedAcademic
          }
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
          onDownloadDocument={onDownloadDocument}
          onSendToBank={onSendToBank}
          onVerifyDocument={onVerifyDocument}
          onRejectDocument={onRejectDocument}
        />
        <OcrDocumentGroup
          title="Family & Co-Applicant Documents"
          icon="group"
          docs={
            docSubTab === "action"
              ? actionRequiredCoApplicant
              : docSubTab === "rejected"
                ? rejectedCoApplicant
                : completedCoApplicant
          }
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
          onDownloadDocument={onDownloadDocument}
          onSendToBank={onSendToBank}
          onVerifyDocument={onVerifyDocument}
          onRejectDocument={onRejectDocument}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-[22px] text-emerald-600">shield</span>
          <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Cross-Document Validation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validationChecks.map((check) => (
            <OcrValidationCard
              key={check.label}
              check={check}
              application={application}
              fullName={fullName}
              extractedName={extractedName}
              extractedDob={extractedDob}
              dobMatched={dobMatched}
              crossDocNameMismatch={crossDocNameMismatch}
              handleSyncField={handleSyncField}
              isSyncing={isSyncing}
              panDoc={panDoc}
              passportDoc={passportDoc}
              aadhaarDoc={aadhaarDoc}
              panName={panName}
              passportName={passportName}
              aadhaarName={aadhaarName}
              getComparableValue={getComparableValue}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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
  onDownloadDocument,
  onSendToBank,
  onVerifyDocument,
  onRejectDocument,
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
  onDownloadDocument?: (doc: OcrSummaryDoc) => void;
  onSendToBank?: (doc: OcrSummaryDoc) => void;
  onVerifyDocument?: (docId: string) => void;
  onRejectDocument?: (docId: string, reason: string) => void;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[22px] text-emerald-600">{icon}</span>
        <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">{title}</h3>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
        <span className="material-symbols-outlined text-[18px]">upload</span>
        Add
      </button>
    </div>

    <div className="space-y-4">
      {loading ? (
        Array.from({ length: 2 }).map((_, idx) => (
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
            rejectionReason={doc.rejectionReason}
            uploaded={doc.uploaded}
            fileName={doc.fileName}
            onPreview={() => onPreviewDocument(doc)}
            onViewFile={() => onViewDocument(doc)}
            onDelete={() => onDeleteDocument(doc)}
            onUpload={(file) => onUploadDocument(doc, file)}
            onDownload={onDownloadDocument ? () => onDownloadDocument(doc) : undefined}
            onSendToBank={onSendToBank ? () => onSendToBank(doc) : undefined}
            onVerify={onVerifyDocument ? () => onVerifyDocument(doc.id) : undefined}
            onReject={onRejectDocument ? (reason) => onRejectDocument(doc.id, reason) : undefined}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/20">
          <span className="material-symbols-outlined text-[28px] text-slate-300 mb-2 block">description</span>
          <p className="text-[12px] font-bold text-slate-400">No documents in this view</p>
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
  rejectionReason,
  uploaded,
  fileName,
  onPreview,
  onViewFile,
  onDelete,
  onUpload,
  onDownload,
  onSendToBank,
  onVerify,
  onReject,
}: {
  confidence: number;
  title: string;
  fieldsCount: number;
  uploadAge: string;
  status: string;
  rejectionReason?: string;
  uploaded?: boolean;
  fileName?: string;
  onPreview: () => void;
  onViewFile: () => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
  onDownload?: () => void;
  onSendToBank?: () => void;
  onVerify?: () => void;
  onReject?: (reason: string) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { prompt: dialogPrompt } = useDialog();
  const statusLower = String(status || "").toLowerCase();
  const hasFile = Boolean(uploaded || fileName || ["uploaded", "verified", "approved", "rejected"].includes(statusLower));
  const tone =
    confidence >= 90
      ? { text: "text-emerald-700", bar: "bg-emerald-500", icon: "verified", iconText: "text-emerald-600" }
      : confidence >= 75
        ? { text: "text-amber-700", bar: "bg-amber-500", icon: "warning", iconText: "text-amber-500" }
        : confidence > 0
          ? { text: "text-rose-700", bar: "bg-rose-500", icon: "error", iconText: "text-rose-500" }
          : { text: "text-slate-500", bar: "bg-slate-300", icon: "pending", iconText: "text-slate-400" };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${hasFile
      ? "border-slate-200 bg-white"
      : "border-dashed border-slate-300 bg-slate-50/40 opacity-75 hover:opacity-100"
      }`}>
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
          <span className={`material-symbols-outlined text-[22px] mt-0.5 ${hasFile ? "text-emerald-600" : "text-slate-400"}`}>
            {hasFile ? "verified_user" : "contact_mail"}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[16px] font-bold text-slate-800 truncate">{title}</h4>
              {hasFile && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${["verified", "approved"].includes(statusLower)
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100/80"
                  : statusLower === "rejected"
                    ? "bg-rose-50 text-rose-700 border-rose-100/80"
                    : "bg-blue-50 text-blue-700 border-blue-100/80"
                  }`}>
                  {["verified", "approved"].includes(statusLower) ? "Verified" : statusLower === "rejected" ? "Rejected" : "Pending Review"}
                </span>
              )}
            </div>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              {hasFile ? `${fieldsCount} fields extracted` : "⚠️ Pending upload"}
            </p>
            {statusLower === "rejected" && rejectionReason && (
              <p className="text-[12px] font-bold text-rose-600 mt-1.5 bg-rose-50/50 px-3 py-1 rounded-lg border border-rose-100/50 inline-block">
                Reason: {rejectionReason}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasFile && (
            <>
              <button
                type="button"
                onClick={onPreview}
                title={`Quick look: ${title}`}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  title={`Download ${title}`}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
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
            </>
          )}
        </div>
      </div>

      {hasFile && (
        <>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-black">
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            Uploaded: {uploadAge}
          </div>
          <div className="mt-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <p className={`text-[11px] font-black uppercase tracking-widest ${tone.text}`}>
                OCR Confidence: {confidence}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {/* Send to Bank Action Row */}
        {/* {hasFile && onSendToBank && (
          <button
            type="button"
            onClick={onSendToBank}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            Send to Bank
          </button>
        )} */}

        {hasFile ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onViewFile}
                className="inline-flex items-center gap-1.5 text-[12px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                View file
              </button>

              {onVerify && onReject && !["verified", "approved", "rejected"].includes(statusLower) && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <button
                    type="button"
                    onClick={onVerify}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const reason = await dialogPrompt("Please enter the reason for rejecting this document:", "Enter rejection reason...");
                      if (reason !== null) {
                        onReject(reason.trim());
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    Reject
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-[12px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors ml-auto"
            >
              <span className="material-symbols-outlined text-[17px]">sync</span>
              Re-upload
            </button>
          </div>

        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-md shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            Upload Document
          </button>
        )}
      </div>
    </div>
  );
};

const OcrValidationCard = ({
  check,
  application,
  fullName,
  extractedName,
  extractedDob,
  dobMatched,
  crossDocNameMismatch,
  handleSyncField,
  isSyncing,
  panDoc,
  passportDoc,
  aadhaarDoc,
  panName,
  passportName,
  aadhaarName,
  getComparableValue,
}: {
  check: ValidationCheck;
  application: any;
  fullName: string;
  extractedName: string;
  extractedDob: string;
  dobMatched: boolean;
  crossDocNameMismatch: boolean;
  handleSyncField: (field: string, value: any) => Promise<void>;
  isSyncing: boolean;
  panDoc?: OcrSummaryDoc;
  passportDoc?: OcrSummaryDoc;
  aadhaarDoc?: OcrSummaryDoc;
  panName: string | null;
  passportName: string | null;
  aadhaarName: string | null;
  getComparableValue: (val: any) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDob = check.label.toLowerCase().includes("dob") || check.label.toLowerCase().includes("birth") || check.detail.toLowerCase().includes("dob");
  const isName = check.label.toLowerCase().includes("name") || check.detail.toLowerCase().includes("name");

  const hasInteractiveDetails = (isDob && !dobMatched) || (isName && (crossDocNameMismatch || extractedName !== fullName));

  const tone =
    check.status === "success"
      ? "border-emerald-200 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-50/60"
      : check.status === "error"
        ? "border-rose-200 bg-rose-50/40 text-rose-700 hover:bg-rose-50/60 shadow-sm"
        : check.status === "warning"
          ? "border-amber-200 bg-amber-50/40 text-amber-700 hover:bg-amber-50/60"
          : "border-slate-200 bg-slate-50/70 text-slate-500 hover:bg-slate-50";

  const icon =
    check.status === "success"
      ? "check_circle"
      : check.status === "error"
        ? "dangerous"
        : check.status === "warning"
          ? "warning"
          : "pending";

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'ring-2 ring-emerald-500/20' : ''} ${tone}`}>
      <div
        onClick={() => hasInteractiveDetails && setIsOpen(!isOpen)}
        className={`p-5 flex items-start justify-between gap-4 select-none ${hasInteractiveDetails ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-[24px] shrink-0 mt-0.5">{icon}</span>
          <div>
            <h4 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
              {check.label}
              {hasInteractiveDetails && (
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`}>
                  expand_more
                </span>
              )}
            </h4>
            <p className="text-[13px] font-medium text-slate-600 mt-1">{check.detail}</p>
          </div>
        </div>

        {hasInteractiveDetails && !isOpen && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0 self-center bg-slate-100/80 px-2.5 py-1 rounded-lg">
            View Details
          </span>
        )}
      </div>

      {hasInteractiveDetails && isOpen && (
        <div className="px-5 pb-5 pt-1 bg-white/70 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          {isDob && (
            <div className="space-y-4 mt-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                DOB Discrepancy Diff Viewer
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase">PROFILE DOB</p>
                  <p className="text-[14px] font-bold text-slate-800 mt-1">{application.dob || "Not set"}</p>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                  <p className="text-[9px] font-black text-rose-500 uppercase">OCR EXTRACTED DOB</p>
                  <p className="text-[14px] font-bold text-rose-700 mt-1">{extractedDob || "Not extracted"}</p>
                </div>
              </div>
              {extractedDob && (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleSyncField('date_of_birth', extractedDob);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  {isSyncing ? "Syncing..." : "Sync DOB to Profile"}
                </button>
              )}
            </div>
          )}

          {isName && (
            <div className="space-y-4 mt-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Cross-Document Name Verification
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase">Source</th>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase">Extracted Name</th>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-[12px]">
                    <tr>
                      <td className="px-4 py-2.5 font-extrabold text-slate-500 uppercase">Profile</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{fullName}</td>
                      <td className="px-4 py-2.5 text-right">-</td>
                    </tr>
                    {panDoc?.uploaded && (
                      <tr>
                        <td className="px-4 py-2.5 font-extrabold text-slate-500 uppercase">PAN Card</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{panName || "Not extracted"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {panName && getComparableValue(panName) !== getComparableValue(fullName) && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleSyncField('full_name', panName);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              Sync
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                    {passportDoc?.uploaded && (
                      <tr>
                        <td className="px-4 py-2.5 font-extrabold text-slate-500 uppercase">Passport</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{passportName || "Not extracted"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {passportName && getComparableValue(passportName) !== getComparableValue(fullName) && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleSyncField('full_name', passportName);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              Sync
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                    {aadhaarDoc?.uploaded && (
                      <tr>
                        <td className="px-4 py-2.5 font-extrabold text-slate-500 uppercase">Aadhaar</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{aadhaarName || "Not extracted"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {aadhaarName && getComparableValue(aadhaarName) !== getComparableValue(fullName) && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleSyncField('full_name', aadhaarName);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              Sync
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
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
            <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-black">
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

const SideBySideComparisonModal = ({
  doc1,
  doc2,
  userId,
  onClose,
}: {
  doc1: OcrSummaryDoc;
  doc2: OcrSummaryDoc;
  userId: string;
  onClose: () => void;
}) => {
  const url1 = `/api/documents/view/${userId}/${doc1.docType}`;
  const url2 = `/api/documents/view/${userId}/${doc2.docType}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-[95vw] h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
              <span className="material-symbols-outlined text-[26px]">compare</span>
            </div>
            <div>
              <h3 className="text-[22px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Review Discrepancy</h3>
              <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest mt-0.5">Cross-Document Verification Mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content splits into 2 panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Doc 1 */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[12px] font-black uppercase text-slate-500 tracking-wider">Document 1: {doc1.name}</span>
              <span className="text-[12px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                {String((doc1.extractedData as any)?.full_name || (doc1.extractedData as any)?.name || 'Unknown')}
              </span>
            </div>
            <div className="flex-1 bg-slate-100 p-4">
              <iframe src={url1} className="w-full h-full rounded-xl border border-slate-200 bg-white" />
            </div>
          </div>

          {/* Right panel: Doc 2 */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[12px] font-black uppercase text-slate-500 tracking-wider">Document 2: {doc2.name}</span>
              <span className="text-[12px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                {String((doc2.extractedData as any)?.full_name || (doc2.extractedData as any)?.name || 'Unknown')}
              </span>
            </div>
            <div className="flex-1 bg-slate-100 p-4">
              <iframe src={url2} className="w-full h-full rounded-xl border border-slate-200 bg-white" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 animate-pulse">warning</span>
            <p className="text-[12px] font-medium text-slate-600">
              A name mismatch was identified by AI. Please review the scanned files and perform any profile modifications as needed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ApplicationDetailView;
