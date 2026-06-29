"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { agentApi } from "@/lib/api";
import { format } from "date-fns";

// --- Types ---
export interface StudentApplication {
    id: string;
    userId?: string;
    applicationNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dob: string;
    city: string;
    state: string;
    loanType: "Domestic" | "Abroad" | string;
    courseName: string;
    collegeName: string;
    courseStartDate: string;
    amount: number;
    coApplicantName?: string;
    coApplicantRelationship?: string;
    coApplicantMobile?: string;
    source: string;
    notes?: string;
    status: "pending" | "processing" | "approved" | "rejected" | "disbursed" | string;
    stage: string;
    bank: string;
    commissionRate: number;
    projectedCommission: number;
    lastUpdated: string;
    documents: Array<{ docType: string; docName: string; status: "verified" | "pending" | "not_uploaded" | "rejected"; uploadedBy?: string; rejectionReason?: string; version: string }>;
    journey: Array<{ date: string; title: string; desc: string; done: boolean; type?: string }>;
    bankStatus: {
        product: string;
        refNumber: string;
        submittedOn: string;
        tatExpected: string;
        queryText?: string;
        queryDeadline?: string;
    };
    communicationLog: Array<{ sender: string; timestamp: string; message: string }>;
}

export interface FollowUpTask {
    id: string;
    type: "Callback" | "Doc Chase" | "Bank Query" | "Sanction Expiry" | "Campus Event" | "Student Callback" | "New Lead Follow-Up" | string;
    studentName: string;
    studentId?: string;
    dateTime: string;
    notes: string;
    reminder: string;
    isOverdue: boolean;
    isCompleted: boolean;
    daysAgo?: number;
}

export interface SubAgent {
    id: string;
    name: string;
    territory: string;
    leadsThisMonth: number;
    sanctionsThisMonth: number;
    theirCut: number;
    myCut: number;
    accessActive: boolean;
    trainingCompleted: number;
    totalTraining: number;
    lastLogin: string;
}

export interface ActivityFeedItem {
    id: string;
    applicationId: string;
    applicationNumber: string;
    studentName: string;
    fromStatus: string;
    toStatus: string;
    changeReason?: string;
    createdAt: string;
}

export interface PipelineCounts {
    leads: number;
    submitted: number;
    bank_review: number;
    approved: number;
    disbursed: number;
}

interface AgentContextType {
    user: any;
    logout: () => void;
    token: string | null;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    stats: any;
    setStats: (stats: any) => void;
    pipeline: PipelineCounts;
    activityFeed: ActivityFeedItem[];
    actionItems: FollowUpTask[];
    applications: StudentApplication[];
    setApplications: React.Dispatch<React.SetStateAction<StudentApplication[]>>;
    totalLeadCount: number;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (val: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (val: boolean) => void;
    autoStartUser: any;
    setAutoStartUser: (val: any) => void;
    toast: { message: string; type: "success" | "info" | "warning" } | null;
    setToast: (val: any) => void;
    showToast: (message: string, type: "success" | "info" | "warning") => void;
    tasks: FollowUpTask[];
    setTasks: React.Dispatch<React.SetStateAction<FollowUpTask[]>>;
    subAgents: SubAgent[];
    setSubAgents: React.Dispatch<React.SetStateAction<SubAgent[]>>;
    lmsModules: any[];
    setLmsModules: React.Dispatch<React.SetStateAction<any[]>>;
    botMessages: Array<{ sender: "user" | "bot"; text: string }>;
    setBotMessages: React.Dispatch<React.SetStateAction<Array<{ sender: "user" | "bot"; text: string }>>>;
    botInput: string;
    setBotInput: (val: string) => void;
    leadForm: any;
    setLeadForm: React.Dispatch<React.SetStateAction<any>>;
    eligCheck: any;
    setEligCheck: React.Dispatch<React.SetStateAction<any>>;
    eligResult: any;
    eligLoading: boolean;
    setEligResult: (val: any) => void;
    csvFile: File | null;
    setCsvFile: (val: File | null) => void;
    csvPreview: any[];
    setCsvPreview: React.Dispatch<React.SetStateAction<any[]>>;
    csvUploaded: boolean;
    setCsvUploaded: (val: boolean) => void;
    newTaskForm: any;
    setNewTaskForm: React.Dispatch<React.SetStateAction<any>>;
    calendarFilter: string;
    setCalendarFilter: (val: string) => void;
    docUploadState: any;
    setDocUploadState: React.Dispatch<React.SetStateAction<any>>;
    docShareState: any;
    setDocShareState: React.Dispatch<React.SetStateAction<any>>;
    inviteSubAgentForm: any;
    setInviteSubAgentForm: React.Dispatch<React.SetStateAction<any>>;
    studentSearch: string;
    setStudentSearch: (val: string) => void;
    studentStatusFilter: string;
    setStudentStatusFilter: (val: string) => void;
    studentLoanTypeFilter: string;
    setStudentLoanTypeFilter: (val: string) => void;
    studentsPage: number;
    setStudentsPage: (val: number) => void;
    studentsLoading: boolean;
    downloadCSV: () => void;
    downloadPDF: () => void;
    loadData: () => Promise<void>;
    loadStudents: (search?: string, status?: string, loanType?: string, page?: number) => Promise<void>;
    handleLeadSubmit: (e: React.FormEvent) => Promise<boolean>;
    handleRunEligibility: (e: React.FormEvent) => Promise<void>;
    handleConfirmCSVImport: () => void;
    handleDocumentUpload: (studentId: string, docType: string, customFile?: string) => void;
    handleSendDocLink: () => void;
    handleAddTask: (e: React.FormEvent) => void;
    handleInviteSubAgent: (e: React.FormEvent) => void;
    handleAskBot: (e: React.FormEvent) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
    const { user, logout, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [pipeline, setPipeline] = useState<PipelineCounts>({ leads: 0, submitted: 0, bank_review: 0, approved: 0, disbursed: 0 });
    const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
    const [actionItems, setActionItems] = useState<FollowUpTask[]>([]);
    const [applications, setApplications] = useState<StudentApplication[]>([]);
    const [totalLeadCount, setTotalLeadCount] = useState(0);
    const [studentsPage, setStudentsPage] = useState(1);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [eligLoading, setEligLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [autoStartUser, setAutoStartUser] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

    // Initial default student data aligning with the blueprint
    const defaultStudents: StudentApplication[] = useMemo(() => [
        {
            id: "LEAD-1092",
            applicationNumber: "VL-APP-2026-01092",
            firstName: "Priya",
            lastName: "Sharma",
            email: "priya.sharma@gmail.com",
            phoneNumber: "9876543210",
            dob: "2004-05-15",
            city: "Hyderabad",
            state: "Telangana",
            loanType: "Domestic",
            courseName: "B.Tech CSE",
            collegeName: "IIT Bombay",
            courseStartDate: "2026-07-15",
            amount: 1200000,
            coApplicantName: "Ramesh Sharma",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543211",
            source: "Walk-In",
            status: "approved",
            stage: "sanction",
            bank: "SBI",
            commissionRate: 0.70,
            projectedCommission: 8400,
            lastUpdated: "10-Jun-2026",
            documents: [
                { docType: "identity_proof", docName: "Aadhar Card", status: "verified", uploadedBy: "Agent", version: "v1" },
                { docType: "pan_card", docName: "PAN Card", status: "verified", uploadedBy: "Agent", version: "v1" },
                { docType: "marksheet_10th", docName: "10th Marksheet", status: "verified", uploadedBy: "Student", version: "v1" },
                { docType: "marksheet_12th", docName: "12th Marksheet", status: "verified", uploadedBy: "Student", version: "v1" },
                { docType: "admission_letter", docName: "Admission Letter", status: "verified", uploadedBy: "Agent", version: "v1" },
                { docType: "bank_statement", docName: "6-Month Bank Statement", status: "verified", uploadedBy: "Agent", version: "v1" },
                { docType: "income_proof", docName: "Income Certificate", status: "rejected", uploadedBy: "Staff Request", version: "v1", rejectionReason: "Stamp missing — Please re-upload stamped copy" },
                { docType: "fee_structure", docName: "Fee Structure", status: "verified", uploadedBy: "Agent", version: "v1" },
                { docType: "photo", docName: "Passport Photo", status: "verified", uploadedBy: "Agent", version: "v1" }
            ],
            journey: [
                { date: "18-May-2026", title: "Lead Submitted", desc: "Submitted by Krishna Agency", done: true },
                { date: "18-May-2026", title: "Welcome Alert", desc: "Welcome WhatsApp message dispatched to student", done: true },
                { date: "20-May-2026", title: "Counsellor Contact", desc: "First connection call made by Staff (Neha Sharma)", done: true },
                { date: "21-May-2026", title: "Documents Requested", desc: "9 checklist files requested", done: true },
                { date: "25-May-2026", title: "Documents Received", desc: "All core files uploaded to server", done: true },
                { date: "26-May-2026", title: "AI OCR Verification", desc: "8/9 documents auto-verified (96% confidence score)", done: true },
                { date: "27-May-2026", title: "Staff Verification", desc: "Document check completed", done: true },
                { date: "01-Jun-2026", title: "Bank Submission", desc: "Application sent to SBI for processing", done: true },
                { date: "10-Jun-2026", title: "SBI Query Raised", desc: "Income Certificate requires physical employer stamp", done: true, type: "alert" }
            ],
            bankStatus: {
                product: "SBI Scholar Loan",
                refNumber: "VL-SBI-1092",
                submittedOn: "01-Jun-2026",
                tatExpected: "12 working days (by 17-Jun-2026)",
                queryText: "Income Certificate — original stamp required",
                queryDeadline: "22-Jun-2026"
            },
            communicationLog: [
                { sender: "Staff Neha Sharma", timestamp: "10-Jun-2026 12:31 PM", message: "Bank has raised a query on the income certificate. The bank needs a stamped original copy. Please ask Priya's father to re-submit with the seal. Deadline: 22-Jun-2026." }
            ]
        },
        {
            id: "LEAD-1093",
            applicationNumber: "VL-APP-2026-01093",
            firstName: "Rahul",
            lastName: "Sinha",
            email: "rahul.sinha@gmail.com",
            phoneNumber: "9876543220",
            dob: "2003-09-24",
            city: "Secunderabad",
            state: "Telangana",
            loanType: "Domestic",
            courseName: "MBBS",
            collegeName: "JIPMER Puducherry",
            courseStartDate: "2026-08-01",
            amount: 800000,
            coApplicantName: "Anil Sinha",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543221",
            source: "College Event",
            status: "processing",
            stage: "bank_review",
            bank: "HDFC Credila",
            commissionRate: 0.70,
            projectedCommission: 5600,
            lastUpdated: "12-Jun-2026",
            documents: [
                { docType: "identity_proof", docName: "Aadhar Card", status: "verified", version: "v1" },
                { docType: "pan_card", docName: "PAN Card", status: "verified", version: "v1" }
            ],
            journey: [
                { date: "15-May-2026", title: "Lead Logged", desc: "Registered via Event QR Capture", done: true },
                { date: "20-May-2026", title: "Submitted to Bank", desc: "HDFC portal upload finalized", done: true }
            ],
            bankStatus: {
                product: "HDFC Education Loan Pro",
                refNumber: "VL-HDFC-889",
                submittedOn: "20-May-2026",
                tatExpected: "9 working days"
            },
            communicationLog: []
        },
        {
            id: "LEAD-1094",
            applicationNumber: "VL-APP-2026-01094",
            firstName: "Anjali",
            lastName: "Raju",
            email: "anjali.raju@gmail.com",
            phoneNumber: "9876543230",
            dob: "2005-01-12",
            city: "Hyderabad",
            state: "Telangana",
            loanType: "Abroad",
            courseName: "MS Data Science",
            collegeName: "University of Maryland",
            courseStartDate: "2026-08-25",
            amount: 3200000,
            coApplicantName: "Raju Kurian",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543231",
            source: "Direct Apply",
            status: "processing",
            stage: "credit_review",
            bank: "Avanse",
            commissionRate: 1.00,
            projectedCommission: 32000,
            lastUpdated: "13-Jun-2026",
            documents: [
                { docType: "identity_proof", docName: "Aadhar Card", status: "verified", version: "v1" },
                { docType: "pan_card", docName: "PAN Card", status: "verified", version: "v1" },
                { docType: "admission_letter", docName: "Admission Letter", status: "verified", version: "v1" },
                { docType: "bank_statement", docName: "Bank Statement", status: "pending", version: "v1" }
            ],
            journey: [
                { date: "22-May-2026", title: "Lead Logged", desc: "Direct website enrollment", done: true },
                { date: "23-May-2026", title: "Documents Verified", desc: "KYC checks cleared", done: true },
                { date: "29-May-2026", title: "Avanse Submission", desc: "Files shared with credit manager", done: true }
            ],
            bankStatus: {
                product: "Avanse Study Abroad",
                refNumber: "VL-AVN-113",
                submittedOn: "29-May-2026",
                tatExpected: "6 working days"
            },
            communicationLog: []
        },
        {
            id: "LEAD-1095",
            applicationNumber: "VL-APP-2026-01095",
            firstName: "Meena",
            lastName: "Pillai",
            email: "meena.pillai@gmail.com",
            phoneNumber: "9876543240",
            dob: "2004-11-05",
            city: "Nizamabad",
            state: "Telangana",
            loanType: "Domestic",
            courseName: "BBA",
            collegeName: "Symbiosis Pune",
            courseStartDate: "2026-07-10",
            amount: 1500000,
            coApplicantName: "Gopal Pillai",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543241",
            source: "Walk-In",
            status: "pending",
            stage: "document_pending",
            bank: "Axis Bank",
            commissionRate: 0.85,
            projectedCommission: 12750,
            lastUpdated: "14-Jun-2026",
            documents: [],
            journey: [
                { date: "24-May-2026", title: "Lead Registered", desc: "Added to queue by Krishna Agency", done: true }
            ],
            bankStatus: {
                product: "Axis Prime Loan",
                refNumber: "VL-AX-402",
                submittedOn: "Pending Documents",
                tatExpected: "15 working days once files complete"
            },
            communicationLog: []
        },
        {
            id: "LEAD-1096",
            applicationNumber: "VL-APP-2026-01096",
            firstName: "Kiran",
            lastName: "Rao",
            email: "kiran.rao@gmail.com",
            phoneNumber: "9876543250",
            dob: "2002-08-30",
            city: "Warangal",
            state: "Telangana",
            loanType: "Abroad",
            courseName: "M.S. Mechanical",
            collegeName: "TU Munich",
            courseStartDate: "2026-10-01",
            amount: 2500000,
            coApplicantName: "Prasad Rao",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543251",
            source: "Direct Web",
            status: "disbursed",
            stage: "disbursement_done",
            bank: "Auxilo",
            commissionRate: 0.90,
            projectedCommission: 22500,
            lastUpdated: "15-Jun-2026",
            documents: [
                { docType: "identity_proof", docName: "Aadhar Card", status: "verified", version: "v1" },
                { docType: "pan_card", docName: "PAN Card", status: "verified", version: "v1" },
                { docType: "marksheet_12th", docName: "12th Marksheet", status: "verified", version: "v1" },
                { docType: "admission_letter", docName: "Admission Letter", status: "verified", version: "v1" },
                { docType: "disbursement_proof", docName: "Disbursement Receipt", status: "verified", version: "v1" }
            ],
            journey: [
                { date: "05-May-2026", title: "Lead Submitted", desc: "Registered by Krishna Agency", done: true },
                { date: "10-May-2026", title: "Submitted to Auxilo", desc: "Sent with co-applicant guarantee", done: true },
                { date: "28-May-2026", title: "Sanctioned Issued", desc: "Sanction letter VL-SNC-987 generated", done: true },
                { date: "15-Jun-2026", title: "Disbursed", desc: "Auxilo wire transfer completed to college", done: true }
            ],
            bankStatus: {
                product: "Auxilo Abroad Special",
                refNumber: "VL-AUX-554",
                submittedOn: "10-May-2026",
                tatExpected: "Disbursed successfully"
            },
            communicationLog: []
        }
    ], []);

    // Calendar Follow-Ups State
    const [tasks, setTasks] = useState<FollowUpTask[]>([
        { id: "task-1", type: "Bank Query", studentName: "Rahul Sinha", dateTime: "2026-06-23T10:30:00", notes: "Bank query raised by HDFC — 24 hr deadline", reminder: "1 hour before", isOverdue: true, isCompleted: false },
        { id: "task-2", type: "Doc Chase", studentName: "Anjali Raju", dateTime: "2026-06-23T12:00:00", notes: "Document re-upload request from Staff (Income Cert)", reminder: "15 min before", isOverdue: true, isCompleted: false },
        { id: "task-3", type: "Sanction Expiry", studentName: "Kiran Rao", dateTime: "2026-06-28T17:00:00", notes: "Sanction expires in 5 days — disbursement pending", reminder: "1 day before", isOverdue: false, isCompleted: false },
        { id: "task-4", type: "Doc Chase", studentName: "Meena Pillai", dateTime: "2026-06-21T09:00:00", notes: "Applied 4 days ago — no documents yet", reminder: "1 day before", isOverdue: true, isCompleted: false, daysAgo: 2 },
        { id: "task-5", type: "Callback", studentName: "Deepak Reddy", dateTime: "2026-06-22T11:00:00", notes: "Bank submitted, no update in 8 days", reminder: "1 hour before", isOverdue: true, isCompleted: false, daysAgo: 1 },
        { id: "task-6", type: "Student Callback", studentName: "Sai Krishna", dateTime: "2026-06-22T15:30:00", notes: "Counter-offer presented — student hasn't responded", reminder: "15 min before", isOverdue: true, isCompleted: false }
    ]);

    // Sub-agents List
    const [subAgents, setSubAgents] = useState<SubAgent[]>([
        { id: "sa-1", name: "Ramesh DSA", territory: "Karimnagar", leadsThisMonth: 8, sanctionsThisMonth: 3, theirCut: 12600, myCut: 8400, accessActive: true, trainingCompleted: 4, totalTraining: 6, lastLogin: "2 hours ago" },
        { id: "sa-2", name: "Lata Associates", territory: "Nizamabad", leadsThisMonth: 6, sanctionsThisMonth: 2, theirCut: 8400, myCut: 5600, accessActive: true, trainingCompleted: 6, totalTraining: 6, lastLogin: "Yesterday" }
    ]);

    // LMS Modules
    const [lmsModules, setLmsModules] = useState([
        { id: "lms-1", category: "Foundation", title: "Module 1: Vidyaloans Platform Overview", progress: 100, score: 92, completed: true },
        { id: "lms-2", category: "Foundation", title: "Module 2: Lead Submission & Student Basics", progress: 100, score: 88, completed: true },
        { id: "lms-3", category: "Foundation", title: "Module 3: Document Collection Best Practices", progress: 100, score: 95, completed: true },
        { id: "lms-4", category: "Intermediate", title: "Module 4: Bank Products & Eligibility Guide", progress: 100, score: 85, completed: true },
        { id: "lms-5", category: "Intermediate", title: "Module 5: Co-Applicant Income & CIBIL Basics", progress: 100, score: 79, completed: true },
        { id: "lms-6", category: "Advanced", title: "Module 6: Abroad Loans — Country-Specific Guide", progress: 100, score: 90, completed: true },
        { id: "lms-7", category: "Advanced", title: "Module 7: Collateral Loans & Property Documents", progress: 60, score: 0, completed: false },
        { id: "lms-8", category: "Advanced", title: "Module 8: Balance Transfer & Refinancing", progress: 0, score: 0, completed: false },
        { id: "lms-9", category: "Compliance", title: "Module 9: KYC, DPDP & Data Privacy", progress: 100, score: 98, completed: true }
    ]);

    // AI Knowledge Bot Messages State
    const [botMessages, setBotMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
        { sender: "bot", text: "Hello! Ask me any product eligibility query, bank requirements, or compliance guidelines. Try asking: 'Which banks accept partial collateral?'" }
    ]);
    const [botInput, setBotInput] = useState("");

    // Single Lead Submission Form State
    const [leadForm, setLeadForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        dob: "",
        city: "",
        state: "Telangana",
        loanType: "Domestic",
        courseName: "",
        collegeName: "",
        courseStartDate: "",
        amount: "",
        coApplicantName: "",
        coApplicantRelationship: "Parent",
        coApplicantMobile: "",
        source: "Referral",
        notes: ""
    });

    // Eligibility Checker Form State
    const [eligCheck, setEligCheck] = useState({
        course: "B.Tech",
        college: "IIT Bombay",
        amount: "1200000",
        income: "600000"
    });
    const [eligResult, setEligResult] = useState<any>(null);

    // CSV Bulk Upload State
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<any[]>([
        { name: "Priya Sharma", mobile: "98XXXXXXXX", course: "B.Tech", college: "IIT Bombay", amount: "12,00,000", status: "Valid" },
        { name: "Rahul Kumar", mobile: "97XXXXXXXX", course: "MBBS", college: "JIPMER", amount: "8,00,000", status: "Valid" },
        { name: "Asha Reddy", mobile: "96XXXXXXXX", course: "MBA (Abroad)", college: "Wharton", amount: "45,00,000", status: "Valid" }
    ]);
    const [csvUploaded, setCsvUploaded] = useState(false);

    // Follow-up Calendar Form State
    const [newTaskForm, setNewTaskForm] = useState({
        type: "Callback",
        studentId: "",
        dateTime: "",
        notes: "",
        reminder: "15 min before"
    });
    const [calendarFilter, setCalendarFilter] = useState("All");

    // Unified Document Center Upload Form State
    const [docUploadState, setDocUploadState] = useState({
        studentId: "LEAD-1092",
        docType: "identity_proof",
        fileNote: ""
    });
    const [docShareState, setDocShareState] = useState({
        studentId: "LEAD-1092",
        channel: "WhatsApp",
        expiry: "48"
    });

    // Sub-agent Invite Form State
    const [inviteSubAgentForm, setInviteSubAgentForm] = useState({
        name: "",
        mobile: "",
        email: "",
        territory: ""
    });

    // Filter controls for student table
    const [studentSearch, setStudentSearch] = useState("");
    const [studentStatusFilter, setStudentStatusFilter] = useState("All");
    const [studentLoanTypeFilter, setStudentLoanTypeFilter] = useState("All");

    const showToast = useCallback((message: string, type: "success" | "info" | "warning") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Payout ledger download trigger simulation
    const downloadCSV = () => {
        showToast("Generating CSV statement... download started.", "success");
    };

    const downloadPDF = () => {
        showToast("Generating PDF statement... download started.", "success");
    };

    const calculateStatsLocally = useCallback((list: StudentApplication[]) => {
        const total = list.length;
        const totalAmount = list.reduce((acc, curr) => acc + curr.amount, 0);
        const disbursed = list.filter(x => x.status === "disbursed" || x.status === "approved").reduce((acc, curr) => acc + curr.amount, 0);
        const revenue = list.filter(x => x.status === "disbursed" || x.status === "approved").reduce((acc, curr) => acc + curr.projectedCommission, 0);
        setStats({
            total,
            totalAmount,
            disbursedAmount: disbursed,
            revenue
        });
    }, []);

    // Map raw API lead record to the rich StudentApplication UI model
    const mapApiApp = useCallback((apiApp: any): StudentApplication => {
        const projected = (parseFloat(apiApp.amount) || 0) * 0.007;
        return {
            id: apiApp.id,
            userId: apiApp.userId || apiApp.user?.id,
            applicationNumber: apiApp.applicationNumber || `VL-APP-2026-${String(apiApp.id).slice(-5)}`,
            firstName: apiApp.firstName || apiApp.user?.firstName || "Student",
            lastName: apiApp.lastName || apiApp.user?.lastName || "",
            email: apiApp.email || apiApp.user?.email || "",
            phoneNumber: apiApp.phoneNumber || apiApp.phone || apiApp.user?.phoneNumber || "",
            dob: apiApp.dateOfBirth || apiApp.user?.dateOfBirth || "2000-01-01",
            city: apiApp.city || "Hyderabad",
            state: apiApp.state || "Telangana",
            loanType: apiApp.loanType || "Domestic",
            courseName: apiApp.courseName || "Undergraduate",
            collegeName: apiApp.collegeName || apiApp.universityName || "State University",
            courseStartDate: apiApp.courseStartDate || "2026-07-01",
            amount: parseFloat(apiApp.amount) || 0,
            status: apiApp.status || "pending",
            stage: apiApp.stage || "application_submitted",
            source: apiApp.source || "Agent Network",
            bank: apiApp.bank || "Pending Partner",
            commissionRate: apiApp.commissionRate || 0.70,
            projectedCommission: apiApp.projectedCommission || projected,
            lastUpdated: format(new Date(apiApp.updatedAt || Date.now()), "dd-MMM-yyyy"),
            documents: apiApp.documents || [],
            journey: apiApp.journey || [
                { date: format(new Date(apiApp.createdAt || Date.now()), "dd-MMM-yyyy"), title: "Lead Submitted", desc: "Submitted via Agent Network", done: true }
            ],
            bankStatus: apiApp.bankStatus || {
                product: apiApp.bank ? `${apiApp.bank} Pro Scheme` : "Reviewing Scheme",
                refNumber: `REF-${String(apiApp.id).slice(-6).toUpperCase()}`,
                submittedOn: format(new Date(apiApp.submittedAt || Date.now()), "dd-MMM-yyyy"),
                tatExpected: "10 working days"
            },
            communicationLog: apiApp.communicationLog || []
        };
    }, []);

    // Load paginated/filtered students list
    const loadStudents = useCallback(async (
        search?: string, status?: string, loanType?: string, page = 1
    ) => {
        setStudentsLoading(true);
        try {
            const res = await agentApi.getApplications({ search, status, loanType, page, limit: 20 }) as any;
            const apiApps = res.leads || res.data || [];
            const mapped: StudentApplication[] = apiApps.map(mapApiApp);
            setApplications(mapped.length > 0 ? mapped : defaultStudents);
            setTotalLeadCount(res.totalCount || mapped.length);
            setStudentsPage(page);
        } catch (e) {
            console.error("[AgentContext] loadStudents failed:", e);
            setApplications(defaultStudents);
        } finally {
            setStudentsLoading(false);
        }
    }, [mapApiApp, defaultStudents]);

    // Load summary stats, pipeline, activity feed, and action items
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, pipelineRes, feedRes, actionRes, appsRes] = await Promise.allSettled([
                agentApi.getStats(),
                agentApi.getPipeline(),
                agentApi.getActivityFeed(),
                agentApi.getActionItems(),
                agentApi.getApplications({ page: 1, limit: 20 }),
            ]);

            // Stats
            if (statsRes.status === "fulfilled" && (statsRes.value as any)?.success) {
                const d = (statsRes.value as any).data;
                setStats({
                    total: d.totalLeads ?? d.total ?? 0,
                    activeCount: d.activeCount ?? 0,
                    totalAmount: d.totalAmount || 0,
                    disbursedAmount: d.disbursedAmount || 0,
                    revenue: d.revenue || 0,
                });
            }

            // Pipeline
            if (pipelineRes.status === "fulfilled" && (pipelineRes.value as any)?.success) {
                setPipeline((pipelineRes.value as any).data as PipelineCounts);
            }

            // Activity feed
            if (feedRes.status === "fulfilled" && (feedRes.value as any)?.success) {
                const feed: ActivityFeedItem[] = (feedRes.value as any).data || [];
                setActivityFeed(feed);
            }

            // Action items (query/doc-chase alerts from bank)
            if (actionRes.status === "fulfilled" && (actionRes.value as any)?.success) {
                const items = (actionRes.value as any).data || [];
                if (items.length > 0) setActionItems(items);
            }

            // Applications list
            if (appsRes.status === "fulfilled") {
                const res = appsRes.value as any;
                const apiApps = res.leads || res.data || [];
                const mapped: StudentApplication[] = apiApps.map(mapApiApp);
                if (mapped.length > 0) {
                    setApplications(mapped);
                    setTotalLeadCount(res.totalCount || mapped.length);
                    calculateStatsLocally(mapped);
                } else {
                    setApplications(defaultStudents);
                    calculateStatsLocally(defaultStudents);
                }
            } else {
                setApplications(defaultStudents);
                calculateStatsLocally(defaultStudents);
            }
        } catch (e) {
            console.error("[AgentContext] loadData failed:", e);
            setApplications(defaultStudents);
            calculateStatsLocally(defaultStudents);
        } finally {
            setLoading(false);
        }
    }, [defaultStudents, calculateStatsLocally, mapApiApp]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLeadSubmit = async (e: React.FormEvent): Promise<boolean> => {
        e.preventDefault();
        if (!leadForm.firstName || !leadForm.lastName || !leadForm.phoneNumber || !leadForm.email || !leadForm.amount) {
            showToast("Please fill all required student basics and loan details", "warning");
            return false;
        }

        setLoading(true);
        try {
            const res = await agentApi.createLead({
                firstName: leadForm.firstName,
                lastName: leadForm.lastName,
                email: leadForm.email,
                phoneNumber: leadForm.phoneNumber,
                dob: leadForm.dob,
                city: leadForm.city,
                state: leadForm.state,
                loanType: leadForm.loanType,
                courseName: leadForm.courseName,
                collegeName: leadForm.collegeName,
                courseStartDate: leadForm.courseStartDate,
                amount: parseFloat(leadForm.amount) || 0,
                coApplicantName: leadForm.coApplicantName,
                coApplicantRelationship: leadForm.coApplicantRelationship,
                coApplicantMobile: leadForm.coApplicantMobile,
                source: leadForm.source,
                notes: leadForm.notes,
            });

            if (res && (res as any).success) {
                showToast(`Lead ${leadForm.firstName} ${leadForm.lastName} submitted successfully!`, "success");
                setLeadForm({
                    firstName: "",
                    lastName: "",
                    phoneNumber: "",
                    email: "",
                    dob: "",
                    city: "",
                    state: "Telangana",
                    loanType: "Domestic",
                    courseName: "",
                    collegeName: "",
                    courseStartDate: "",
                    amount: "",
                    coApplicantName: "",
                    coApplicantRelationship: "Parent",
                    coApplicantMobile: "",
                    source: "Walk-In",
                    notes: ""
                });
                await loadData();
                return true;
            } else {
                showToast((res as any).message || "Failed to submit lead.", "warning");
                return false;
            }
        } catch (err) {
            console.error("Failed to submit lead:", err);
            showToast("Error connecting to server. Please try again.", "warning");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRunEligibility = async (e: React.FormEvent) => {
        e.preventDefault();
        setEligLoading(true);
        setEligResult(null);
        try {
            const res = await agentApi.checkEligibility({
                amount: parseFloat(eligCheck.amount) || 0,
                age: 21, // default age; could be derived from dob if available
                coApplicant: eligCheck.income ? { income: parseFloat(eligCheck.income) } : null,
            }) as any;

            if (res?.success) {
                // Enrich backend result with UI-friendly labels
                const income = parseFloat(eligCheck.income) || 0;
                const amount = parseFloat(eligCheck.amount) || 0;
                let eligibleBanks = res.eligible
                    ? income >= 600000
                        ? ["Avanse", "SBI", "HDFC Credila", "Axis Bank"]
                        : ["Avanse (Recommended)", "Auxilo"]
                    : ["Avanse (Partial Collateral Required)"];

                let chance = res.eligible
                    ? income >= 350000
                        ? "HIGH CHANCE OF SANCTION"
                        : "MEDIUM CHANCE OF SANCTION — Co-applicant income is low"
                    : "LOW CHANCE OF SANCTION — " + (res.reasons?.[0] || "Insufficient criteria");

                let color = res.eligible
                    ? income >= 350000
                        ? "text-emerald-500 border-emerald-200 bg-emerald-50"
                        : "text-amber-600 border-amber-200 bg-amber-50"
                    : "text-red-600 border-red-200 bg-red-50";

                setEligResult({
                    chance,
                    color,
                    banks: eligibleBanks,
                    score: res.score,
                    reasons: res.reasons,
                    requiredIncome: amount > 1500000 ? "₹5.5 Lakhs/year" : "₹3.5 Lakhs/year",
                    details: `Based on admission at ${eligCheck.college || 'selected university'} for ${eligCheck.course || 'selected course'}. Eligibility score: ${res.score}/100.`
                });
            } else {
                throw new Error("Eligibility check returned an error");
            }
        } catch (err) {
            // Fallback to local calculation on API failure
            const income = parseFloat(eligCheck.income) || 0;
            const amount = parseFloat(eligCheck.amount) || 0;
            let eligibleBanks = ["Avanse (Recommended)"];
            let chance = "HIGH CHANCE OF SANCTION";
            let color = "text-emerald-500 border-emerald-200 bg-emerald-50";
            if (income < 350000) { chance = "MEDIUM CHANCE — Co-applicant income is low"; color = "text-amber-600 border-amber-200 bg-amber-50"; eligibleBanks.push("Auxilo"); }
            else { eligibleBanks.push("SBI", "HDFC Credila", "Axis Bank"); }
            if (amount > 3000000 && income < 600000) { chance = "LOW CHANCE — Insufficient income for high loan"; color = "text-red-600 border-red-200 bg-red-50"; eligibleBanks = ["Avanse (Partial Collateral Required)"]; }
            setEligResult({ chance, color, banks: eligibleBanks, requiredIncome: amount > 1500000 ? "₹5.5L/yr" : "₹3.5L/yr", details: `Local estimate for ${eligCheck.college || 'selected college'}.` });
        } finally {
            setEligLoading(false);
        }
    };

    const handleConfirmCSVImport = () => {
        const importedLeads: StudentApplication[] = [
            {
                id: "LEAD-CSV-1",
                applicationNumber: "VL-APP-2026-CSV1",
                firstName: "Priya",
                lastName: "Sharma",
                email: "priya.csv@gmail.com",
                phoneNumber: "9876543201",
                dob: "2004-01-01",
                city: "Mumbai",
                state: "Maharashtra",
                loanType: "Domestic",
                courseName: "B.Tech",
                collegeName: "IIT Bombay",
                courseStartDate: "2026-07-20",
                amount: 1200000,
                source: "Bulk CSV",
                status: "pending",
                stage: "application_submitted",
                bank: "SBI",
                commissionRate: 0.70,
                projectedCommission: 8400,
                lastUpdated: format(new Date(), "dd-MMM-yyyy"),
                documents: [],
                journey: [],
                bankStatus: { product: "SBI Scholar", refNumber: "VL-SBI-CSV1", submittedOn: "N/A", tatExpected: "12 days" },
                communicationLog: []
            },
            {
                id: "LEAD-CSV-2",
                applicationNumber: "VL-APP-2026-CSV2",
                firstName: "Rahul",
                lastName: "Kumar",
                email: "rahul.csv@gmail.com",
                phoneNumber: "9765432101",
                dob: "2003-08-15",
                city: "Puducherry",
                state: "Puducherry",
                loanType: "Domestic",
                courseName: "MBBS",
                collegeName: "JIPMER",
                courseStartDate: "2026-08-01",
                amount: 800000,
                source: "Bulk CSV",
                status: "pending",
                stage: "application_submitted",
                bank: "HDFC Credila",
                commissionRate: 0.70,
                projectedCommission: 5600,
                lastUpdated: format(new Date(), "dd-MMM-yyyy"),
                documents: [],
                journey: [],
                bankStatus: { product: "HDFC Study Loan", refNumber: "VL-HD-CSV2", submittedOn: "N/A", tatExpected: "9 days" },
                communicationLog: []
            },
            {
                id: "LEAD-CSV-3",
                applicationNumber: "VL-APP-2026-CSV3",
                firstName: "Asha",
                lastName: "Reddy",
                email: "asha.csv@gmail.com",
                phoneNumber: "9654321098",
                dob: "2002-12-10",
                city: "Hyderabad",
                state: "Telangana",
                loanType: "Abroad",
                courseName: "MBA (Abroad)",
                collegeName: "Wharton",
                courseStartDate: "2026-09-10",
                amount: 4500000,
                source: "Bulk CSV",
                status: "pending",
                stage: "application_submitted",
                bank: "Avanse",
                commissionRate: 1.00,
                projectedCommission: 45000,
                lastUpdated: format(new Date(), "dd-MMM-yyyy"),
                documents: [],
                journey: [],
                bankStatus: { product: "Avanse Premium", refNumber: "VL-AV-CSV3", submittedOn: "N/A", tatExpected: "6 days" },
                communicationLog: []
            }
        ];

        const updatedApps = [...importedLeads, ...applications];
        setApplications(updatedApps);
        calculateStatsLocally(updatedApps);
        setCsvUploaded(false);
        setCsvFile(null);
        showToast("Successfully imported 3 student leads from CSV template!", "success");
    };

    const handleDocumentUpload = (studentId: string, docType: string, customFile?: string) => {
        const fileName = customFile || `${docType}.pdf`;
        setApplications(prev => prev.map(student => {
            if (student.id === studentId) {
                const existingDoc = student.documents.find(d => d.docType === docType);
                let updatedDocs: StudentApplication['documents'] = [];
                if (existingDoc) {
                    updatedDocs = student.documents.map(d => 
                        d.docType === docType ? { ...d, status: "pending" as const, uploadedBy: "Agent", version: `v${parseInt(d.version.replace("v", "")) + 1}` } : d
                    );
                } else {
                    updatedDocs = [...student.documents, { docType, docName: docType.replace(/_/g, " ").toUpperCase(), status: "pending" as const, uploadedBy: "Agent", version: "v1" }];
                }
                
                const updatedJourney = [
                    ...student.journey,
                    { date: format(new Date(), "dd-MMM-yyyy"), title: "Document Uploaded", desc: `Doc Type: ${docType.replace(/_/g, " ").toUpperCase()} (${fileName}) uploaded`, done: true }
                ];

                return { ...student, documents: updatedDocs, journey: updatedJourney, lastUpdated: format(new Date(), "dd-MMM-yyyy") };
            }
            return student;
        }));

        showToast(`Document uploaded successfully: ${fileName}. Awaiting verification review.`, "success");
    };

    const handleSendDocLink = () => {
        const student = applications.find(x => x.id === docShareState.studentId);
        if (!student) return;
        showToast(`Secure upload link sent to student ${student.firstName} via ${docShareState.channel}! (Expires in ${docShareState.expiry} hours)`, "success");
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const student = applications.find(x => x.id === newTaskForm.studentId);
        if (!newTaskForm.studentId || !newTaskForm.dateTime) {
            showToast("Please fill all required calendar fields", "warning");
            return;
        }

        const newTask: FollowUpTask = {
            id: `task-${tasks.length + 1}`,
            type: newTaskForm.type,
            studentName: student ? `${student.firstName} ${student.lastName}` : "General Task",
            studentId: newTaskForm.studentId,
            dateTime: newTaskForm.dateTime,
            notes: newTaskForm.notes || `${newTaskForm.type} scheduled follow-up`,
            reminder: newTaskForm.reminder,
            isOverdue: false,
            isCompleted: false
        };

        setTasks([newTask, ...tasks]);
        showToast("New callback follow-up successfully scheduled on calendar!", "success");
        setNewTaskForm({
            type: "Callback",
            studentId: "",
            dateTime: "",
            notes: "",
            reminder: "15 min before"
        });
    };

    const handleInviteSubAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteSubAgentForm.name || !inviteSubAgentForm.mobile || !inviteSubAgentForm.email) {
            showToast("Please fill all sub-agent contact basics", "warning");
            return;
        }

        const newSub: SubAgent = {
            id: `sa-${subAgents.length + 1}`,
            name: inviteSubAgentForm.name,
            territory: inviteSubAgentForm.territory || "Secunderabad",
            leadsThisMonth: 0,
            sanctionsThisMonth: 0,
            theirCut: 0,
            myCut: 0,
            accessActive: true,
            trainingCompleted: 0,
            totalTraining: 6,
            lastLogin: "Never logged in"
        };

        setSubAgents([...subAgents, newSub]);
        showToast(`Invitation sent to ${inviteSubAgentForm.name} via WhatsApp/Email!`, "success");
        setInviteSubAgentForm({ name: "", mobile: "", email: "", territory: "" });
    };

    const handleAskBot = (e: React.FormEvent) => {
        e.preventDefault();
        if (!botInput.trim()) return;

        const userMsg = botInput.trim();
        const updated = [...botMessages, { sender: "user" as const, text: userMsg }];
        setBotMessages(updated);
        setBotInput("");

        setTimeout(() => {
            let reply = "I'm checking the VidyaLoans advisor guidelines for that query. Can you clarify which university is involved?";
            const msgLower = userMsg.toLowerCase();
            if (msgLower.includes("collateral") || msgLower.includes("property")) {
                reply = "Auxilo and Avanse accept partial collateral (up to 50%) for abroad loans above ₹20 Lakhs, subject to a clean legal search title. SBI requires full collateral for loans exceeding ₹7.5 Lakhs unless covered by the CSIS scheme.";
            } else if (msgLower.includes("cibil") || msgLower.includes("score")) {
                reply = "Our partner lenders require a minimum co-applicant CIBIL score of 685. Scores between 650-684 can be processed with Avanse under special high-interest deviations if co-applicant's monthly surplus is high.";
            } else if (msgLower.includes("stamped") || msgLower.includes("income") || msgLower.includes("salary")) {
                reply = "For salary-based co-applicants, we need the last 3 months' salary slips, 2 years of Form 16, and a stamped 6-month bank statement showing the salary credits. A physical stamp is mandatory for government/public sector banks.";
            } else if (msgLower.includes("commission") || msgLower.includes("payout")) {
                reply = "Standard DSA commission is 0.70% of disbursed amount for domestic loans and 1.00% for abroad loans. Payout is processed on the 10th of every month post bank clearance.";
            }
            setBotMessages(prev => [...prev, { sender: "bot" as const, text: reply }]);
        }, 1000);
    };

    return (
        <AgentContext.Provider
            value={{
                user, logout, token,
                loading, setLoading,
                stats, setStats,
                pipeline,
                activityFeed,
                actionItems,
                applications, setApplications,
                totalLeadCount,
                studentsPage, setStudentsPage,
                studentsLoading,
                eligLoading,
                sidebarCollapsed, setSidebarCollapsed,
                sidebarOpen, setSidebarOpen,
                autoStartUser, setAutoStartUser,
                toast, setToast, showToast,
                tasks, setTasks,
                subAgents, setSubAgents,
                lmsModules, setLmsModules,
                botMessages, setBotMessages,
                botInput, setBotInput,
                leadForm, setLeadForm,
                eligCheck, setEligCheck,
                eligResult, setEligResult,
                csvFile, setCsvFile,
                csvPreview, setCsvPreview,
                csvUploaded, setCsvUploaded,
                newTaskForm, setNewTaskForm,
                calendarFilter, setCalendarFilter,
                docUploadState, setDocUploadState,
                docShareState, setDocShareState,
                inviteSubAgentForm, setInviteSubAgentForm,
                studentSearch, setStudentSearch,
                studentStatusFilter, setStudentStatusFilter,
                studentLoanTypeFilter, setStudentLoanTypeFilter,
                downloadCSV, downloadPDF, loadData, loadStudents,
                handleLeadSubmit, handleRunEligibility, handleConfirmCSVImport,
                handleDocumentUpload, handleSendDocLink, handleAddTask,
                handleInviteSubAgent, handleAskBot
            }}
        >
            {children}
        </AgentContext.Provider>
    );
}

export function useAgent() {
    const context = useContext(AgentContext);
    if (!context) throw new Error("useAgent must be used within an AgentProvider");
    return context;
}
