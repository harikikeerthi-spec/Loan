"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { agentApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

// --- Types ---
interface StudentApplication {
    id: string;
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

interface FollowUpTask {
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

interface SubAgent {
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

export default function AgentDashboardPage() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [applications, setApplications] = useState<StudentApplication[]>([]);
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
            collegeName: "Wharton School",
            courseStartDate: "2026-09-10",
            amount: 4500000,
            coApplicantName: "Koteswara Rao",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543231",
            source: "WhatsApp Bot",
            status: "pending",
            stage: "document_verification",
            bank: "Avanse",
            commissionRate: 1.00,
            projectedCommission: 45000,
            lastUpdated: "14-Jun-2026",
            documents: [
                { docType: "identity_proof", docName: "Aadhar Card", status: "pending", version: "v1" }
            ],
            journey: [
                { date: "12-Jun-2026", title: "Lead Created", desc: "Submitted by Sub-Agent: Ramesh DSA", done: true }
            ],
            bankStatus: {
                product: "Avanse Abroad Study Loan",
                refNumber: "VL-AV-745",
                submittedOn: "N/A",
                tatExpected: "6 working days"
            },
            communicationLog: []
        },
        {
            id: "LEAD-1095",
            applicationNumber: "VL-APP-2026-01095",
            firstName: "Kiran",
            lastName: "Rao",
            email: "kiran.rao@hotmail.com",
            phoneNumber: "9876543240",
            dob: "2004-12-05",
            city: "Hyderabad",
            state: "Telangana",
            loanType: "Domestic",
            courseName: "MBA",
            collegeName: "ISB Hyderabad",
            courseStartDate: "2026-08-15",
            amount: 2500000,
            coApplicantName: "Sudhakar Rao",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543241",
            source: "Referral",
            status: "approved",
            stage: "sanction",
            bank: "SBI",
            commissionRate: 0.95,
            projectedCommission: 23750,
            lastUpdated: "15-Jun-2026",
            documents: [],
            journey: [],
            bankStatus: {
                product: "SBI Scholar Loan Elite",
                refNumber: "VL-SBI-1095",
                submittedOn: "05-Jun-2026",
                tatExpected: "12 working days"
            },
            communicationLog: []
        },
        {
            id: "LEAD-1096",
            applicationNumber: "VL-APP-2026-01096",
            firstName: "Venu",
            lastName: "Gopal",
            email: "venu.g@yahoo.com",
            phoneNumber: "9876543250",
            dob: "2004-02-28",
            city: "Hyderabad",
            state: "Telangana",
            loanType: "Domestic",
            courseName: "B.Tech",
            collegeName: "IIT Madras",
            courseStartDate: "2026-07-20",
            amount: 1200000,
            coApplicantName: "Malleswara Rao",
            coApplicantRelationship: "Parent",
            coApplicantMobile: "9876543251",
            source: "Walk-In",
            status: "disbursed",
            stage: "disbursement",
            bank: "HDFC Credila",
            commissionRate: 0.70,
            projectedCommission: 8400,
            lastUpdated: "20-Jun-2026",
            documents: [],
            journey: [],
            bankStatus: {
                product: "HDFC Premium Loan",
                refNumber: "VL-HDFC-902",
                submittedOn: "02-Jun-2026",
                tatExpected: "9 working days"
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

    // Selected Student for Profile View Detail
    const [selectedStudentId, setSelectedStudentId] = useState<string>("LEAD-1092");

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

    // Payout ledger download trigger simulation
    const downloadCSV = () => {
        showToast("Generating CSV statement... download started.", "success");
    };

    const downloadPDF = () => {
        showToast("Generating PDF statement... download started.", "success");
    };

    const showToast = (message: string, type: "success" | "info" | "warning") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load actual API data on mount and merge with local fallback data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, appsRes, tasksRes] = await Promise.all([
                agentApi.getStats(),
                agentApi.getApplications(),
                agentApi.getActionItems()
            ]);
            
            const apiApps = (appsRes as any).leads || (appsRes as any).data || [];
            
            // Map backend Application structure to our rich UI Student structure
            const mappedApiApps: StudentApplication[] = apiApps.map((apiApp: any) => {
                const projected = (parseFloat(apiApp.amount) || 0) * 0.007; // Default 0.70%
                return {
                    id: apiApp.id,
                    applicationNumber: apiApp.applicationNumber || `VL-APP-2026-${apiApp.id.slice(-5)}`,
                    firstName: apiApp.firstName || apiApp.user?.firstName || "Student",
                    lastName: apiApp.lastName || apiApp.user?.lastName || "",
                    email: apiApp.email || apiApp.user?.email || "",
                    phoneNumber: apiApp.phoneNumber || apiApp.user?.phoneNumber || "",
                    dob: apiApp.dateOfBirth || apiApp.user?.dateOfBirth || "2000-01-01",
                    city: apiApp.city || "Hyderabad",
                    state: "Telangana",
                    loanType: apiApp.loanType || "Domestic",
                    courseName: apiApp.courseName || "Undergraduate",
                    collegeName: apiApp.collegeName || "State University",
                    courseStartDate: apiApp.courseStartDate || "2026-07-01",
                    amount: parseFloat(apiApp.amount) || 0,
                    status: apiApp.status || "pending",
                    stage: apiApp.stage || "application_submitted",
                    bank: apiApp.bank || "Pending Partner",
                    commissionRate: 0.70,
                    projectedCommission: apiApp.projectedCommission || projected,
                    lastUpdated: format(new Date(apiApp.updatedAt || Date.now()), "dd-MMM-yyyy"),
                    documents: apiApp.documents || [],
                    journey: apiApp.journey || [
                        { date: format(new Date(apiApp.createdAt || Date.now()), "dd-MMM-yyyy"), title: "Lead Submitted", desc: "Submitted via Agent Network", done: true }
                    ],
                    bankStatus: apiApp.bankStatus || {
                        product: apiApp.bank ? `${apiApp.bank} Pro Scheme` : "Reviewing Scheme",
                        refNumber: `REF-${apiApp.id.slice(-6).toUpperCase()}`,
                        submittedOn: format(new Date(apiApp.submittedAt || Date.now()), "dd-MMM-yyyy"),
                        tatExpected: "10 working days"
                    },
                    communicationLog: apiApp.communicationLog || []
                };
            });

            // Fallback merge for visualization: if API returns data, use it; if no data, fallback to default students
            if (mappedApiApps.length > 0) {
                setApplications(mappedApiApps);
            } else {
                setApplications(defaultStudents);
            }

            // Set Action Items
            if (tasksRes && (tasksRes as any).success) {
                const apiTasks = (tasksRes as any).data || [];
                if (apiTasks.length > 0) {
                    setTasks(apiTasks);
                }
            }

            // Fetch dynamic stats from database, falling back if necessary
            if (statsRes && (statsRes as any).success) {
                const apiStats = (statsRes as any).data;
                setStats({
                    total: apiStats.totalLeads ?? apiStats.total ?? 0,
                    totalAmount: apiStats.totalAmount || 0,
                    disbursedAmount: apiStats.disbursedAmount || 0,
                    revenue: apiStats.revenue || 0
                });
            } else {
                calculateStatsLocally(mappedApiApps.length > 0 ? mappedApiApps : defaultStudents);
            }
        } catch (e) {
            console.error("Failed to load agent backend data. Falling back to local data.", e);
            calculateStatsLocally(defaultStudents);
            setApplications(defaultStudents);
        } finally {
            setLoading(false);
        }
    }, [defaultStudents]);

    const calculateStatsLocally = (list: StudentApplication[]) => {
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
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle lead submission
    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadForm.firstName || !leadForm.lastName || !leadForm.phoneNumber || !leadForm.email || !leadForm.amount) {
            showToast("Please fill all required student basics and loan details", "warning");
            return;
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
                
                // Reset form
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
                
                // Reload dashboard
                await loadData();
                setActiveSection("students");
            } else {
                showToast((res as any).message || "Failed to submit lead.", "warning");
            }
        } catch (err) {
            console.error("Failed to submit lead:", err);
            showToast("Error connecting to server. Please try again.", "warning");
        } finally {
            setLoading(false);
        }
    };

    // Pre-submission eligibility calculator trigger
    const handleRunEligibility = (e: React.FormEvent) => {
        e.preventDefault();
        const income = parseFloat(eligCheck.income) || 0;
        const amount = parseFloat(eligCheck.amount) || 0;
        
        let eligibleBanks = ["Avanse (Recommended)"];
        let chance = "HIGH CHANCE OF SANCTION";
        let color = "text-emerald-500 border-emerald-200 bg-emerald-50";

        if (income < 350000) {
            chance = "MEDIUM CHANCE OF SANCTION — Co-applicant income is low";
            color = "text-amber-600 border-amber-200 bg-amber-50";
            eligibleBanks.push("Auxilo");
        } else {
            eligibleBanks.push("SBI", "HDFC Credila", "Axis Bank");
        }

        if (amount > 3000000 && income < 600000) {
            chance = "LOW CHANCE OF SANCTION — Insufficient income for high loan value";
            color = "text-red-600 border-red-200 bg-red-50";
            eligibleBanks = ["Avanse (Partial Collateral Required)"];
        }

        setEligResult({
            chance,
            color,
            banks: eligibleBanks,
            requiredIncome: amount > 1500000 ? "₹5.5 Lakhs/year" : "₹3.5 Lakhs/year",
            details: `Based on admission at ${eligCheck.college || 'IIT Bombay'} for ${eligCheck.course || 'B.Tech'}.`
        });
    };

    // Handle CSV confirm import
    const handleConfirmCSVImport = () => {
        // Add preview items to state as mock imported students
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
        setActiveSection("students");
    };

    // Document checklist file upload simulator
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
                
                // Also add an application journey activity log entry
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

    // Secure Document link share trigger
    const handleSendDocLink = () => {
        const student = applications.find(x => x.id === docShareState.studentId);
        if (!student) return;
        showToast(`Secure upload link sent to student ${student.firstName} via ${docShareState.channel}! (Expires in ${docShareState.expiry} hours)`, "success");
    };

    // Add task from calendar
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

    // Sub-agent invitation triggers
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

    // AI bot question trigger
    const handleAskBot = (e: React.FormEvent) => {
        e.preventDefault();
        if (!botInput.trim()) return;

        const userMsg = botInput.trim();
        const updated = [...botMessages, { sender: "user" as const, text: userMsg }];
        setBotMessages(updated);
        setBotInput("");

        // Simulate AI logic based on blueprint or standard queries
        setTimeout(() => {
            let replyText = "I'm checking our latest product repository. Can you elaborate or provide co-applicant CIBIL scores?";
            const normalized = userMsg.toLowerCase();
            
            if (normalized.includes("collateral") || normalized.includes("partial")) {
                replyText = "Avanse, Auxilo, and Axis Bank support partial collateral options for higher study amounts (> ₹20L) depending on property verification. SBI offers collateral-free schemes under their Scholar Elite list up to ₹40L for select top-tier institutions.";
            } else if (normalized.includes("tat") || normalized.includes("turnaround")) {
                replyText = "Our current processing TAT benchmarks: Avanse (6 working days), HDFC Credila (9 working days), and SBI (12 working days). Uploading high-fidelity, verified documents via DigiLocker reduces average review TAT by 3 days.";
            } else if (normalized.includes("documents") || normalized.includes("checklist")) {
                replyText = "For domestic loans, the required documents are: Identity Proof (Aadhar/PAN), Academic records (10th/12th marksheets), Admission Letter, Fee structure, Co-Applicant income proof, and 6-month bank statements.";
            } else if (normalized.includes("payout") || normalized.includes("commission")) {
                replyText = "DSAs receive monthly payouts on the 1st of every month via bank transfer. Commissions are calculated based on disbursed amounts: Domestic (< ₹10L is 0.70% total rate, > ₹20L is 0.95%), and Abroad is 1.00% flat rate for Master tier partners.";
            }

            setBotMessages([...updated, { sender: "bot" as const, text: replyText }]);
        }, 800);
    };

    // Find currently selected student
    const selectedStudent = useMemo(() => {
        return applications.find(x => x.id === selectedStudentId) || applications[0];
    }, [applications, selectedStudentId]);

    // Active pipeline and statuses calculations
    const pipelineCount = useMemo(() => {
        return applications.filter(x => ["pending", "processing", "approved"].includes(x.status)).length;
    }, [applications]);

    const bankSubmittedCount = useMemo(() => {
        return applications.filter(x => ["processing", "approved"].includes(x.status) && x.bank !== "Pending Partner").length;
    }, [applications]);

    const statusCounts = useMemo(() => {
        const counts = { pending: 0, processing: 0, approved: 0, disbursed: 0, rejected: 0 };
        applications.forEach(a => {
            if (a.status === "pending") counts.pending++;
            else if (a.status === "processing") counts.processing++;
            else if (a.status === "approved") counts.approved++;
            else if (a.status === "disbursed") counts.disbursed++;
            else if (a.status === "rejected") counts.rejected++;
        });
        return counts;
    }, [applications]);

    // Filtered application rows
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const query = studentSearch.toLowerCase();
            const matchesSearch = 
                app.firstName.toLowerCase().includes(query) ||
                app.lastName.toLowerCase().includes(query) ||
                app.email.toLowerCase().includes(query) ||
                app.applicationNumber.toLowerCase().includes(query) ||
                app.collegeName.toLowerCase().includes(query);

            const matchesStatus = studentStatusFilter === "All" || app.status === studentStatusFilter.toLowerCase();
            const matchesLoanType = studentLoanTypeFilter === "All" || app.loanType === studentLoanTypeFilter;

            return matchesSearch && matchesStatus && matchesLoanType;
        });
    }, [applications, studentSearch, studentStatusFilter, studentLoanTypeFilter]);

    // Task list items filtered by view mode
    const filteredTasks = useMemo(() => {
        if (calendarFilter === "All") return tasks;
        return tasks.filter(t => t.type === calendarFilter);
    }, [tasks, calendarFilter]);

    const statusColors: Record<string, string> = {
        pending: "bg-blue-50 text-blue-700 border-blue-100",
        processing: "bg-amber-50 text-amber-700 border-amber-100",
        approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
        disbursed: "bg-purple-50 text-purple-700 border-purple-100",
        rejected: "bg-red-50 text-red-700 border-red-100"
    };

    return (
        <div className="h-screen overflow-hidden bg-[#fcfaff] flex font-sans selection:bg-[#6605c7]/10 selection:text-[#6605c7]">
            {/* Toast Banner Alert */}
            {toast && (
                <div className="fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-xl bg-white border border-[#6605c7]/10 animate-fade-in-up flex items-center gap-3">
                    <span className={`material-symbols-outlined ${toast.type === 'success' ? 'text-emerald-500' : toast.type === 'warning' ? 'text-rose-500' : 'text-indigo-600'}`}>
                        {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
                    </span>
                    <span className="text-xs font-bold text-gray-800">{toast.message}</span>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:relative lg:translate-x-0 lg:h-full ${sidebarCollapsed ? "w-24 lg:w-24 p-3 lg:pr-2" : "w-80 lg:w-80 p-6 lg:pr-3"} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full bg-white rounded-[3rem] border border-[#6605c7]/5 shadow-[0_20px_50px_rgb(102,5,199,0.06)] overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#6605c7]/5 to-transparent pointer-events-none" />
                    
                    {/* Brand Banner Logo */}
                    <div className={`py-6 ${sidebarCollapsed ? "px-2 justify-center" : "px-8 justify-between"} border-b border-[#6605c7]/5 relative z-10 flex items-center`}>
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                            <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-xl shadow-[#6605c7]/30 transform group-hover:rotate-[15deg] transition-all duration-500 flex-shrink-0">
                                <span className="material-symbols-outlined font-black text-xl">handshake</span>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="animate-fade-in">
                                    <span className="font-display font-black text-2xl tracking-tighter text-gray-900 block leading-none">Vidya<span className="text-[#6605c7]">Agent</span></span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40">DSA Partner Hub</span>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(true); }} 
                                className="hidden lg:flex w-7 h-7 rounded-lg bg-gray-50 hover:bg-[#6605c7]/5 text-gray-400 hover:text-[#6605c7] items-center justify-center transition-all"
                                title="Collapse Sidebar"
                            >
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                        )}
                    </div>

                    {/* Nav Items List */}
                    <nav className={`flex-1 ${sidebarCollapsed ? "px-1.5" : "px-4"} py-3 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar`}>
                        {!sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 mb-1">Main</p>}
                        
                        <button onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "overview" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Home Dashboard">
                            <span className="material-symbols-outlined text-xl">space_dashboard</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Home Dashboard</span>}
                        </button>

                        <button onClick={() => { setActiveSection("lead_submission"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "lead_submission" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Submit Lead">
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Submit Lead</span>}
                        </button>

                        <button onClick={() => { setActiveSection("students"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "students" || activeSection === "student_profile" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="My Students">
                            <span className="material-symbols-outlined text-xl">groups</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">My Students</span>}
                        </button>

                        {!sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Backoffice</p>}

                        <button onClick={() => { setActiveSection("document_management"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "document_management" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Documents">
                            <span className="material-symbols-outlined text-xl">folder_shared</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Documents</span>}
                        </button>

                        <button onClick={() => { setActiveSection("calendar"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "calendar" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Calendar">
                            <span className="material-symbols-outlined text-xl">calendar_month</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Calendar</span>}
                        </button>

                        <button onClick={() => { setActiveSection("commissions"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "commissions" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Commissions">
                            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Commissions</span>}
                        </button>

                        {!sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Grow Network</p>}

                        <button onClick={() => { setActiveSection("analytics"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "analytics" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Performance">
                            <span className="material-symbols-outlined text-xl">monitoring</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Performance</span>}
                        </button>

                        <button onClick={() => { setActiveSection("sub_agents"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "sub_agents" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Sub-Agents">
                            <span className="material-symbols-outlined text-xl">share_reviews</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Sub-Agents</span>}
                        </button>

                        <button onClick={() => { setActiveSection("training"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "training" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="LMS & Training">
                            <span className="material-symbols-outlined text-xl">school</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">LMS & Training</span>}
                        </button>

                        {!sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Live Support</p>}
                        
                        <button onClick={() => { setActiveSection("chat_staff"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "chat_staff" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Staff RM Line">
                            <span className="material-symbols-outlined text-xl">support_agent</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Staff RM Line</span>}
                        </button>

                        <button onClick={() => { setActiveSection("chat_student"); setSidebarOpen(false); }} className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${activeSection === "chat_student" ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`} title="Student Line">
                            <span className="material-symbols-outlined text-xl">forum</span>
                            {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">Student Line</span>}
                        </button>
                    </nav>

                    {/* Agent Session Info Footer */}
                    <div className={`${sidebarCollapsed ? "p-2" : "p-4"} border-t border-[#6605c7]/5 bg-[#fcfaff]/50 backdrop-blur-xl relative z-10 flex-shrink-0`}>
                        <div className={`${sidebarCollapsed ? "p-1.5 rounded-full mb-2" : "p-3 rounded-[1.5rem] mb-3"} bg-white border border-[#6605c7]/10 group hover:border-[#6605c7]/30 transition-all duration-500 flex justify-center`}>
                            <div className="flex items-center gap-3 w-full justify-center">
                                <div className="w-10 h-10 rounded-full border border-gray-100 shadow-sm overflow-hidden bg-gradient-to-br from-[#6605c7]/10 to-[#6605c7]/5 flex-shrink-0">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=KrishnaAgency`} alt="Agent" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                {!sidebarCollapsed && (
                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <p className="text-xs font-black text-gray-900 truncate leading-none mb-1">Krishna Agency</p>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none">Master DSA</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={logout} className={`w-full py-2.5 rounded-[1rem] flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[9px] tracking-widest uppercase border border-transparent hover:border-red-100 ${sidebarCollapsed ? "px-0" : "gap-2"}`} title="Terminate Session">
                            <span className="material-symbols-outlined text-base">logout</span>
                            {!sidebarCollapsed && <span>Terminate Session</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 p-6 lg:pl-3 min-w-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-white rounded-[3rem] border border-[#6605c7]/5 shadow-[0_20px_50px_rgb(102,5,199,0.06)] overflow-hidden flex flex-col relative">
                    
                    {/* Header bar */}
                    <header className="h-28 px-12 flex justify-between items-center sticky top-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-[#6605c7]/5 flex-shrink-0">
                        <div className="flex items-center gap-10">
                            <button 
                                onClick={() => {
                                    if (window.innerWidth >= 1024) {
                                        setSidebarCollapsed(!sidebarCollapsed);
                                    } else {
                                        setSidebarOpen(!sidebarOpen);
                                    }
                                }} 
                                className="p-4 text-[#6605c7] hover:bg-[#6605c7]/5 rounded-2xl transition-all"
                                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            >
                                <span className="material-symbols-outlined">
                                    {sidebarCollapsed ? "menu_open" : "menu"}
                                </span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-black font-display text-gray-900 capitalize tracking-tighter leading-none mb-1">
                                    {activeSection === "overview" ? "Agent Operations Hub" : activeSection.replace('_', ' ')}
                                </h1>
                                <p className="text-[10px] font-bold text-[#6605c7]/40 uppercase tracking-[0.2em]">Krishna Agency | June 2026</p>
                            </div>
                        </div>

                        {/* Support Desk Quick Trigger Info */}
                        <div className="flex items-center gap-8">
                            <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-gray-100">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Assigned Staff RM</p>
                                    <p className="text-xs font-black text-[#6605c7]">Neha Sharma</p>
                                </div>
                                <button onClick={() => setActiveSection("chat_staff")} className="w-10 h-10 rounded-xl bg-[#6605c7]/5 border border-[#6605c7]/10 flex items-center justify-center text-[#6605c7] hover:bg-[#6605c7] hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-xl">contact_phone</span>
                                </button>
                            </div>
                            <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-[#6605c7]/5 text-[#6605c7] hover:bg-[#6605c7]/10 transition-all border border-[#6605c7]/10">
                                <span className="material-symbols-outlined">notifications</span>
                                <div className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
                            </button>
                        </div>
                    </header>

                    {/* Scrollable modules render window */}
                    <div className={`flex-1 overflow-y-auto relative ${activeSection.startsWith('chat_') ? 'p-0' : 'p-12 space-y-12'}`}>
                        {/* Decorative mesh background blur */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6605c7]/5 rounded-full blur-[150px] pointer-events-none" />

                        {/* ================= MODULE 1: HOME DASHBOARD ================= */}
                        {activeSection === "overview" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                {/* Welcome Bar Personalized */}
                                <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-premium-noise pointer-events-none" />
                                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                                    
                                    <div className="space-y-2 relative z-10">
                                        <h2 className="text-3xl font-black font-display tracking-tight">👋 Good Morning, Krishna Agency</h2>
                                        <p className="text-white/80 font-medium text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-amber-300">workspace_premium</span> Tier: <strong className="text-amber-300 uppercase tracking-widest font-black">Master</strong></span>
                                            <span>|</span>
                                            <span>Territory: <strong>Hyderabad, Secunderabad</strong></span>
                                            <span>|</span>
                                            <span>9 days remaining in June 2026</span>
                                        </p>
                                    </div>
                                    <div className="flex flex-col xs:flex-row gap-4 items-stretch xs:items-center relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                                        <div className="text-left xs:text-right">
                                            <p className="text-[9px] font-black uppercase text-white/60 tracking-widest leading-none mb-1">Staff Relations Officer</p>
                                            <p className="text-xs font-black text-white">Neha Sharma</p>
                                            <p className="text-[10px] text-white/80 mt-0.5">+91 98765 43210</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setActiveSection("chat_staff")} className="px-4 py-2 bg-white text-[#6605c7] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#6605c7]/10 hover:text-white transition-all flex items-center gap-1.5 shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">chat</span> Chat RM
                                            </button>
                                            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">phone_iphone</span> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </section>

                                {/* KPI Summary Row */}
                                <section>
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                                        <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[150px] hover:-translate-y-1 transition-all duration-300">
                                            <div>
                                                <p className="text-[#6605c7]/50 text-[9px] font-black uppercase tracking-widest mb-1">Total Students</p>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-full inline-block">All Time</span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 font-display mt-4">{stats?.total || 312}</p>
                                        </div>
                                        <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[150px] hover:-translate-y-1 transition-all duration-300">
                                            <div>
                                                <p className="text-[#6605c7]/50 text-[9px] font-black uppercase tracking-widest mb-1">Active Pipeline</p>
                                                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full inline-block">Ongoing</span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 font-display mt-4">{pipelineCount}</p>
                                        </div>
                                        <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[150px] hover:-translate-y-1 transition-all duration-300">
                                            <div>
                                                <p className="text-[#6605c7]/50 text-[9px] font-black uppercase tracking-widest mb-1">Submitted to Bank</p>
                                                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full inline-block">In Review</span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 font-display mt-4">{bankSubmittedCount}</p>
                                        </div>
                                        <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[150px] hover:-translate-y-1 transition-all duration-300">
                                            <div>
                                                <p className="text-[#6605c7]/50 text-[9px] font-black uppercase tracking-widest mb-1">Sanctioned Month</p>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full inline-block flex items-center gap-0.5">12 Achieved <span className="material-symbols-outlined text-[10px]">workspace_premium</span></span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 font-display mt-4">12 🏆</p>
                                        </div>
                                        <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[150px] hover:-translate-y-1 transition-all duration-300">
                                            <div>
                                                <p className="text-[#6605c7]/50 text-[9px] font-black uppercase tracking-widest mb-1">Commission Month</p>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full inline-block">▲ +₹12K vs Last</span>
                                            </div>
                                            <p className="text-3xl font-black text-emerald-600 font-display mt-4">₹{(stats?.revenue || 72000).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Monthly Target Progress Gauges */}
                                <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">June 2026 — Monthly Goals Target</h3>
                                        <span className="text-xs font-black text-[#6605c7] bg-[#6605c7]/5 px-4 py-1.5 rounded-full uppercase tracking-wider">Master tier progress</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                                <span>Target Sanctions: 15</span>
                                                <span className="text-[#6605c7]">12 Achieved (80%)</span>
                                            </div>
                                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b24e5] rounded-full" style={{ width: "80%" }} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                                <span>Target Loan Value: ₹1.8 Cr</span>
                                                <span className="text-[#6605c7]">₹1.44 Cr Achieved (80%)</span>
                                            </div>
                                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b24e5] rounded-full" style={{ width: "80%" }} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                                <span>Commission Goal: ₹90,000</span>
                                                <span className="text-[#6605c7]">₹72,000 Achieved (80%)</span>
                                            </div>
                                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b24e5] rounded-full" style={{ width: "80%" }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-800 text-xs font-medium">
                                        <span className="material-symbols-outlined text-amber-600">notifications_active</span>
                                        <div className="space-y-1">
                                            <p className="font-bold">📣 You need 3 more sanctions to hit your monthly target!</p>
                                            <p className="text-amber-700">🔔 Alert: 6 students have documents pending — chase them now to accelerate pipeline approvals!</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8 flex flex-col">
                                        {/* Urgent Action Items Panel */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1">
                                            <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                                                <span className="material-symbols-outlined text-rose-500 animate-pulse">priority_high</span> Urgent Actions & Follow Ups
                                            </h3>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">🔴 ACTION REQUIRED TODAY</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-gray-900">Rahul Sinha</p>
                                                                <p className="text-xs text-gray-500">Bank query raised by HDFC — 24 hr deadline</p>
                                                            </div>
                                                            <button onClick={() => { setSelectedStudentId("LEAD-1093"); setActiveSection("students"); }} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all">Resolve Query</button>
                                                        </div>
                                                        <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-gray-900">Anjali Raju</p>
                                                                <p className="text-xs text-gray-500">Document re-upload request from Staff (Income Cert)</p>
                                                            </div>
                                                            <button onClick={() => { setSelectedStudentId("LEAD-1094"); setActiveSection("students"); }} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all">Upload File</button>
                                                        </div>
                                                        <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-gray-900">Kiran Rao</p>
                                                                <p className="text-xs text-gray-500">Sanction expires in 5 days — disbursement pending</p>
                                                            </div>
                                                            <button onClick={() => { setSelectedStudentId("LEAD-1095"); setActiveSection("students"); }} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all">Nudge Lead</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">🟡 FOLLOW UP TODAY</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl flex flex-col justify-between">
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">Meena Pillai</p>
                                                                <p className="text-[11px] text-gray-500 mt-1">Applied 4 days ago — no documents uploaded yet</p>
                                                            </div>
                                                            <button onClick={() => setActiveSection("calendar")} className="mt-4 w-full py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all">Chase Docs</button>
                                                        </div>
                                                        <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl flex flex-col justify-between">
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">Deepak Reddy</p>
                                                                <p className="text-[11px] text-gray-500 mt-1">Bank submitted, no update in 8 days</p>
                                                            </div>
                                                            <button onClick={() => setActiveSection("calendar")} className="mt-4 w-full py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all">Check Status</button>
                                                        </div>
                                                        <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl flex flex-col justify-between">
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">Sai Krishna</p>
                                                                <p className="text-[11px] text-gray-500 mt-1">Counter-offer presented — student hasn't responded</p>
                                                            </div>
                                                            <button onClick={() => setActiveSection("calendar")} className="mt-4 w-full py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all">Call Back</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">✅ RECENT WINS</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between p-3.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-xs">
                                                            <span className="font-bold text-gray-800">🎉 Priya Sharma → Loan Sanctioned ₹14L by SBI</span>
                                                            <span className="font-black text-emerald-600">Commission ₹8,400</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-3.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-xs">
                                                            <span className="font-bold text-gray-800">🎉 Venu Gopal → Disbursed ₹12L HDFC</span>
                                                            <span className="font-black text-emerald-600">Commission ₹7,200 (Pending Payout)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8 flex flex-col">
                                        {/* Pipeline Status Snapshot */}
                                        <div className="bg-[#fcfaff] rounded-[2.5rem] border border-[#6605c7]/5 p-8 relative overflow-hidden flex-1 shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/50 mb-8">Pipeline Status Snapshot</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>New / Docs Pending</span>
                                                        <span>18 students</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: "50%" }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>Documents Received</span>
                                                        <span>14 students</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "40%" }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>AI Verification</span>
                                                        <span>6 students</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#6605c7] rounded-full" style={{ width: "20%" }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>Sent to Bank</span>
                                                        <span>12 students</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: "35%" }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>Sanctioned (Awaiting Disbursal)</span>
                                                        <span>8 students</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>Disbursed ✅</span>
                                                        <span>4 students</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: "15%" }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>Rejected / Not Proceeding</span>
                                                        <span>3 students (re-routing suggested)</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: "10%" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Activity Feed */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">⚡ RECENT ACTIVITY</h3>
                                            <div className="space-y-4">
                                                <div className="flex gap-4 items-start text-xs">
                                                    <span className="font-bold text-gray-400">13:02</span>
                                                    <span className="text-gray-800">Priya Sharma → Loan Sanctioned ₹14L by SBI</span>
                                                </div>
                                                <div className="flex gap-4 items-start text-xs border-t border-gray-50 pt-3">
                                                    <span className="font-bold text-gray-400">12:48</span>
                                                    <span className="text-gray-800">Staff Neha → Docs Verified for Kiran Rao</span>
                                                </div>
                                                <div className="flex gap-4 items-start text-xs border-t border-gray-50 pt-3">
                                                    <span className="font-bold text-gray-400">12:31</span>
                                                    <span className="text-gray-800">HDFC → Query Raised on Rahul Sinha's file</span>
                                                </div>
                                                <div className="flex gap-4 items-start text-xs border-t border-gray-50 pt-3">
                                                    <span className="font-bold text-gray-400">12:00</span>
                                                    <span className="text-gray-800">Your Sub-Agent: Ramesh DSA → New Lead Submitted</span>
                                                </div>
                                                <div className="flex gap-4 items-start text-xs border-t border-gray-50 pt-3">
                                                    <span className="font-bold text-gray-400">11:47</span>
                                                    <span className="text-gray-800">AI OCR → Aadhar verified for Anjali Raju (96%)</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveSection("students")} className="w-full mt-6 py-3 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 transition-all">View All Activity</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 2: LEAD SUBMISSION ================= */}
                        {activeSection === "lead_submission" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                {/* Eligibility checker widget */}
                                <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <span className="material-symbols-outlined text-[10rem]">verified</span>
                                    </div>
                                    
                                    <div className="relative z-10 max-w-2xl space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Tool Suite</span>
                                            <h3 className="text-2xl font-black font-display tracking-tight mt-1">💡 Pre-Submission Eligibility Checker</h3>
                                            <p className="text-slate-400 text-xs mt-1">Verify co-applicant requirements and matching banks before completing final leads creation.</p>
                                        </div>

                                        <form onSubmit={handleRunEligibility} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] uppercase font-bold text-slate-400">Course Type</label>
                                                <select value={eligCheck.course} onChange={(e) => setEligCheck({ ...eligCheck, course: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none">
                                                    <option>B.Tech</option>
                                                    <option>MBBS</option>
                                                    <option>MBA</option>
                                                    <option>MS (Abroad)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] uppercase font-bold text-slate-400">College / Uni</label>
                                                <input type="text" value={eligCheck.college} onChange={(e) => setEligCheck({ ...eligCheck, college: e.target.value })} placeholder="IIT Bombay" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] uppercase font-bold text-slate-400">Loan Amount (₹)</label>
                                                <input type="number" value={eligCheck.amount} onChange={(e) => setEligCheck({ ...eligCheck, amount: e.target.value })} placeholder="1200000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] uppercase font-bold text-slate-400">Co-App Income (₹/yr)</label>
                                                <input type="number" value={eligCheck.income} onChange={(e) => setEligCheck({ ...eligCheck, income: e.target.value })} placeholder="600000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none" />
                                            </div>
                                            <button type="submit" className="sm:col-span-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all">Evaluate Approval Probability</button>
                                        </form>

                                        {eligResult && (
                                            <div className={`p-6 rounded-2xl border ${eligResult.color} space-y-2 animate-fade-in`}>
                                                <h4 className="font-bold text-sm tracking-tight">{eligResult.chance}</h4>
                                                <p className="text-[11px] opacity-80">{eligResult.details}</p>
                                                <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                                                    <span className="font-bold uppercase tracking-wider">Eligible Banks:</span>
                                                    {eligResult.banks.map((b: string, i: number) => (
                                                        <span key={i} className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{b}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Lead submission choices */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Single Lead Form */}
                                    <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">New Student Lead — Single Submit</h3>
                                        
                                        <form onSubmit={handleLeadSubmit} className="space-y-6">
                                            {/* STEP 1: STUDENT BASICS */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 1: STUDENT BASICS</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">First Name *</label>
                                                        <input type="text" required value={leadForm.firstName} onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Last Name *</label>
                                                        <input type="text" required value={leadForm.lastName} onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Mobile Number *</label>
                                                        <input type="tel" required value={leadForm.phoneNumber} onChange={(e) => setLeadForm({ ...leadForm, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" placeholder="Used for WhatsApp alerts" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Address *</label>
                                                        <input type="email" required value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                                                        <input type="date" value={leadForm.dob} onChange={(e) => setLeadForm({ ...leadForm, dob: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">City / State</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input type="text" value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="City" className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                            <select value={leadForm.state} onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                                                <option>Telangana</option>
                                                                <option>Andhra Pradesh</option>
                                                                <option>Maharashtra</option>
                                                                <option>Karnataka</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STEP 2: LOAN DETAILS */}
                                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                                <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 2: LOAN DETAILS</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Loan Type</label>
                                                        <div className="flex gap-4 py-2 text-xs">
                                                            <label className="flex items-center gap-2 font-medium cursor-pointer"><input type="radio" name="loanType" checked={leadForm.loanType === "Domestic"} onChange={() => setLeadForm({ ...leadForm, loanType: "Domestic" })} /> Domestic</label>
                                                            <label className="flex items-center gap-2 font-medium cursor-pointer"><input type="radio" name="loanType" checked={leadForm.loanType === "Abroad"} onChange={() => setLeadForm({ ...leadForm, loanType: "Abroad" })} /> Abroad</label>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Requested Loan Amount (₹) *</label>
                                                        <input type="number" required value={leadForm.amount} onChange={(e) => setLeadForm({ ...leadForm, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Course Name</label>
                                                        <input type="text" value={leadForm.courseName} onChange={(e) => setLeadForm({ ...leadForm, courseName: e.target.value })} placeholder="e.g. B.Tech, MBBS, MBA" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">College / University Name</label>
                                                        <input type="text" value={leadForm.collegeName} onChange={(e) => setLeadForm({ ...leadForm, collegeName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STEP 3: CO-APPLICANT (Optional) */}
                                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                                <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 3: CO-APPLICANT (Optional)</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Co-App Name</label>
                                                        <input type="text" value={leadForm.coApplicantName} onChange={(e) => setLeadForm({ ...leadForm, coApplicantName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Relationship</label>
                                                        <select value={leadForm.coApplicantRelationship} onChange={(e) => setLeadForm({ ...leadForm, coApplicantRelationship: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                                            <option>Parent</option>
                                                            <option>Spouse</option>
                                                            <option>Sibling</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Co-App Mobile</label>
                                                        <input type="tel" value={leadForm.coApplicantMobile} onChange={(e) => setLeadForm({ ...leadForm, coApplicantMobile: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STEP 4: SOURCE & NOTES */}
                                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                                <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 4: SOURCE & NOTES</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">How did they find you?</label>
                                                        <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                                            <option>Referral</option>
                                                            <option>Walk-in</option>
                                                            <option>WhatsApp</option>
                                                            <option>College Event</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Internal Notes for Staff</label>
                                                        <input type="text" value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" placeholder="e.g. Needs immediate dispatch check" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4 border-t border-gray-50">
                                                <button type="submit" className="flex-1 py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Submit Lead</button>
                                                <button type="button" onClick={() => showToast("Lead saved as draft successfully.", "info")} className="px-6 py-4 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all border border-gray-100">Save as Draft</button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Bulk CSV Upload Panel */}
                                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Bulk Lead Import</h3>
                                                <p className="text-gray-400 text-xs mt-1">Upload list of up to 500 leads instantly via CSV mapping.</p>
                                            </div>

                                            <button onClick={() => showToast("Template CSV download started.", "success")} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-sm">download</span> Download CSV Template
                                            </button>

                                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#6605c7]/30 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center min-h-[160px]" onClick={() => setCsvUploaded(true)}>
                                                <span className="material-symbols-outlined text-gray-400 text-3xl mb-2">upload_file</span>
                                                <span className="text-[11px] font-bold text-gray-700">Choose File or Drop CSV Here</span>
                                                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">max 500 leads per file</span>
                                            </div>

                                            {csvUploaded && (
                                                <div className="space-y-4 animate-fade-in">
                                                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                                                        <span className="font-bold text-emerald-800 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">check_circle</span> 3/3 rows valid</span>
                                                        <span className="text-gray-400 text-[10px]">Ready to import</span>
                                                    </div>
                                                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <thead>
                                                                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500">
                                                                    <th className="p-2">Name</th>
                                                                    <th className="p-2">Course</th>
                                                                    <th className="p-2">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {csvPreview.map((x, i) => (
                                                                    <tr key={i} className="border-b border-gray-50 last:border-b-0">
                                                                        <td className="p-2 font-bold">{x.name}</td>
                                                                        <td className="p-2">{x.course}</td>
                                                                        <td className="p-2 font-mono">₹{x.amount}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {csvUploaded && (
                                            <div className="flex gap-2 pt-6">
                                                <button onClick={handleConfirmCSVImport} className="flex-1 py-3 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Confirm Import</button>
                                                <button onClick={() => { setCsvUploaded(false); setCsvFile(null); }} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 transition-all border border-gray-100">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 3: MY STUDENTS ================= */}
                        {activeSection === "students" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                {/* Filters and Search row */}
                                <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <div className="relative sm:col-span-2">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6605c7]/40 text-xl">search</span>
                                            <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search student name, email, ref number..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Pipeline Status</label>
                                            <select value={studentStatusFilter} onChange={(e) => setStudentStatusFilter(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                <option>All</option>
                                                <option>Pending</option>
                                                <option>Processing</option>
                                                <option>Approved</option>
                                                <option>Disbursed</option>
                                                <option>Rejected</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Loan Destination</label>
                                            <select value={studentLoanTypeFilter} onChange={(e) => setStudentLoanTypeFilter(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                <option>All</option>
                                                <option>Domestic</option>
                                                <option>Abroad</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                                        <div className="flex gap-2 text-[10px]">
                                            <button onClick={() => { setStudentStatusFilter("All"); setStudentLoanTypeFilter("All"); setStudentSearch(""); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-250 text-gray-500 rounded-lg font-bold">Reset Filters</button>
                                            <button onClick={() => downloadCSV()} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6605c7] rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">export_notes</span> Export CSV</button>
                                        </div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Showing {filteredApps.length} lead records</div>
                                    </div>
                                </section>

                                {/* Lead list table */}
                                <section className="overflow-x-auto pb-10 custom-scrollbar">
                                    <table className="w-full border-separate border-spacing-y-4">
                                        <thead>
                                            <tr>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Student Name</th>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Course & College</th>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Loan Amount</th>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Status Badge</th>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Bank Partner</th>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Commission</th>
                                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-right border-b border-[#6605c7]/5">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApps.length > 0 ? filteredApps.map((app, idx) => (
                                                <tr key={idx} className="group hover:-translate-y-1 transition-all duration-300">
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] rounded-l-[2rem] border-y border-l border-gray-100 group-hover:border-[#6605c7]/20 transition-all">
                                                        <div className="flex flex-col">
                                                            <button onClick={() => { setSelectedStudentId(app.id); setActiveSection("student_profile"); }} className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] text-left hover:underline transition-colors">{app.firstName} {app.lastName}</button>
                                                            <span className="text-[10px] text-gray-400 mt-0.5">{app.applicationNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800">{app.courseName}</span>
                                                            <span className="text-gray-400">{app.collegeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all font-black text-gray-900 text-sm tracking-tight font-mono">
                                                        ₹{app.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all">
                                                        <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[app.status] || "bg-gray-100 text-gray-500"}`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all text-xs font-bold text-gray-600">
                                                        {app.bank}
                                                    </td>
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[#6605c7]">₹{app.projectedCommission.toLocaleString()}</span>
                                                            <span className="text-[9px] text-gray-400">({app.commissionRate}% cut)</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] rounded-r-[2rem] border-y border-r border-gray-100 group-hover:border-[#6605c7]/20 transition-all text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => { setSelectedStudentId(app.id); setDocUploadState({ ...docUploadState, studentId: app.id }); setActiveSection("document_management"); }} className="w-9 h-9 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] text-gray-500 rounded-xl flex items-center justify-center transition-all" title="Upload Documents">
                                                                <span className="material-symbols-outlined text-lg">upload</span>
                                                            </button>
                                                            <button onClick={() => showToast(`Doc chase WhatsApp reminder template dispatched to ${app.firstName}`, "success")} className="w-9 h-9 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] text-gray-500 rounded-xl flex items-center justify-center transition-all" title="WhatsApp Reminder">
                                                                <span className="material-symbols-outlined text-lg">message</span>
                                                            </button>
                                                            <button onClick={() => { setAutoStartUser({ id: app.id, email: app.email, firstName: app.firstName, lastName: app.lastName }); setActiveSection("chat_student"); }} className="w-9 h-9 bg-[#6605c7] hover:scale-105 text-white rounded-xl flex items-center justify-center transition-all" title="Connect Chat">
                                                                <span className="material-symbols-outlined text-lg">chat</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={7} className="px-8 py-32 text-center bg-white rounded-[2rem] border border-gray-100">
                                                        <div className="flex flex-col items-center justify-center opacity-30">
                                                            <span className="material-symbols-outlined text-7xl mb-4">search_off</span>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No referrals matching criteria</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </section>
                            </div>
                        )}

                        {/* ================= MODULE 4: STUDENT PROFILE DETAIL ================= */}
                        {activeSection === "student_profile" && selectedStudent && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                {/* Profile Header Card */}
                                <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex gap-5 items-center">
                                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white font-black text-2xl flex items-center justify-center shadow-lg">
                                            {selectedStudent.firstName[0]}
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-black text-gray-900 font-display">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColors[selectedStudent.status]}`}>
                                                    {selectedStudent.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedStudent.courseName} — {selectedStudent.collegeName} | Loan Amount: <strong className="text-gray-900">₹{selectedStudent.amount.toLocaleString()}</strong></p>
                                            <p className="text-[10px] text-gray-400">VL Ref Number: {selectedStudent.applicationNumber} | Last Updated: {selectedStudent.lastUpdated}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button onClick={() => { setAutoStartUser({ id: selectedStudent.id, email: selectedStudent.email, firstName: selectedStudent.firstName, lastName: selectedStudent.lastName }); setActiveSection("chat_student"); }} className="px-6 py-3.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-150 transition-all flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">forum</span> Chat student
                                        </button>
                                        <button onClick={() => { setDocUploadState({ ...docUploadState, studentId: selectedStudent.id }); setActiveSection("document_management"); }} className="px-6 py-3.5 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6605c7]/95 transition-all flex items-center gap-2 shadow-sm">
                                            <span className="material-symbols-outlined text-base">cloud_upload</span> Upload Documents
                                        </button>
                                    </div>
                                </section>

                                {/* Tabs for Journey, Documents, Bank Submission, Commission Rate, chat log */}
                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        
                                        {/* Journey Timeline */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-lg text-gray-900 mb-8 uppercase tracking-tight">Application Journey Timeline</h3>
                                            
                                            <div className="relative border-l border-gray-150 pl-6 space-y-6 ml-3">
                                                {selectedStudent.journey.map((j, i) => (
                                                    <div key={i} className="relative">
                                                        <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 bg-white ${j.type === 'alert' ? 'border-rose-500 shadow-[0_0_8px_rgb(239,68,68,0.3)]' : 'border-indigo-600'}`} />
                                                        <div className="text-left space-y-0.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{j.date}</span>
                                                                {j.type === 'alert' && <span className="bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Query Alert</span>}
                                                            </div>
                                                            <h4 className="text-sm font-black text-gray-900">{j.title}</h4>
                                                            <p className="text-xs text-gray-500">{j.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Document Checklist and Status */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Student Document Checklists</h3>
                                                <span className="text-xs font-black text-indigo-600">{selectedStudent.documents.filter(d => d.status === "verified").length} / {selectedStudent.documents.length} Verified</span>
                                            </div>
                                            
                                            <div className="divide-y divide-gray-50">
                                                {selectedStudent.documents.length > 0 ? selectedStudent.documents.map((d, i) => (
                                                    <div key={i} className="py-4 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">{d.docName}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] text-gray-400 font-bold">Uploaded By: {d.uploadedBy || "Student"} | Version: {d.version}</span>
                                                                {d.rejectionReason && <span className="text-rose-600 text-[9px] font-medium block">⚠️ {d.rejectionReason}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${d.status === "verified" ? "bg-emerald-50 text-emerald-700" : d.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                                                {d.status}
                                                            </span>
                                                            {d.status === "rejected" && (
                                                                <button onClick={() => handleDocumentUpload(selectedStudent.id, d.docType, "Income_Cert_Stamped_Resubmitted.pdf")} className="px-3 py-1 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider">Re-upload</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-xs text-gray-400 py-6 text-center">No documents have been logged or synced for this lead yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8 flex flex-col">
                                        {/* Bank Submission Tracker */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">🏛️ BANK SUBMISSION TRACKER</h3>
                                            
                                            <div className="space-y-4 text-xs font-bold text-gray-700">
                                                <div className="flex justify-between border-b border-gray-50 pb-3">
                                                    <span className="text-gray-400">Bank Submitted</span>
                                                    <span>{selectedStudent.bank}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-3">
                                                    <span className="text-gray-400">Product Product</span>
                                                    <span>{selectedStudent.bankStatus.product}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-3">
                                                    <span className="text-gray-400">VL Reference</span>
                                                    <span>{selectedStudent.bankStatus.refNumber}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-3">
                                                    <span className="text-gray-400">Submitted On</span>
                                                    <span>{selectedStudent.bankStatus.submittedOn}</span>
                                                </div>
                                                <div className="flex justify-between pb-3">
                                                    <span className="text-gray-400">TAT Expected</span>
                                                    <span>{selectedStudent.bankStatus.tatExpected}</span>
                                                </div>

                                                {selectedStudent.bankStatus.queryText && (
                                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1 font-medium">
                                                        <p className="font-bold">⚠️ QUERY RAISED:</p>
                                                        <p>{selectedStudent.bankStatus.queryText}</p>
                                                        <p className="text-amber-600 font-bold mt-1">Deadline: {selectedStudent.bankStatus.queryDeadline} (Today!)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Commission rate per student */}
                                        <div className="bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white p-8 rounded-[2.5rem] shadow-md relative overflow-hidden">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-6">💰 ESTIMATED COMMISSION</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="text-3xl font-black font-display">₹{selectedStudent.projectedCommission.toLocaleString()}</div>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between text-white/80">
                                                        <span>Loan Amount</span>
                                                        <span className="font-bold">₹{selectedStudent.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-white/80">
                                                        <span>Commission Rate</span>
                                                        <span className="font-bold">{selectedStudent.commissionRate}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-white/80">
                                                        <span>Payout Status</span>
                                                        <span className="font-bold text-amber-300">Awaiting Sanction</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat communication log snippet */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">💬 MESSAGES FROM STAFF</h3>
                                                
                                                <div className="space-y-4 text-xs max-h-[160px] overflow-y-auto no-scrollbar">
                                                    {selectedStudent.communicationLog.map((log, i) => (
                                                        <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5">
                                                            <div className="flex justify-between text-[9px] font-bold text-gray-400">
                                                                <span>{log.sender}</span>
                                                                <span>{log.timestamp}</span>
                                                            </div>
                                                            <p className="text-gray-700 leading-relaxed">{log.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="pt-6">
                                                <button onClick={() => setActiveSection("chat_staff")} className="w-full py-3 bg-[#6605c7]/5 hover:bg-[#6605c7] hover:text-white text-[#6605c7] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">chat_bubble</span> Connect with Counselors
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* ================= MODULE 5: DOCUMENT MANAGEMENT ================= */}
                        {activeSection === "document_management" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        
                                        {/* Unified Document Upload */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Document Upload Center</h3>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Target Student</label>
                                                    <select value={docUploadState.studentId} onChange={(e) => setDocUploadState({ ...docUploadState, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                        {applications.map((x, i) => (
                                                            <option key={i} value={x.id}>{x.firstName} {x.lastName} ({x.id})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Document Category</label>
                                                    <select value={docUploadState.docType} onChange={(e) => setDocUploadState({ ...docUploadState, docType: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                        <option value="identity_proof">Identity Proof (Aadhar/Passport)</option>
                                                        <option value="pan_card">PAN Card</option>
                                                        <option value="marksheet_10th">10th Marksheet</option>
                                                        <option value="marksheet_12th">12th Marksheet</option>
                                                        <option value="admission_letter">Admission Letter</option>
                                                        <option value="bank_statement">6-Month Bank Statement</option>
                                                        <option value="income_proof">Income Certificate</option>
                                                        <option value="fee_structure">Fee Structure</option>
                                                        <option value="photo">Passport Photo</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-8 text-center hover:border-[#6605c7]/30 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center min-h-[180px]" onClick={() => handleDocumentUpload(docUploadState.studentId, docUploadState.docType)}>
                                                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">cloud_upload</span>
                                                <span className="text-xs font-bold text-gray-700">Drop PDF, JPG, PNG here or Browse</span>
                                                <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">max size 20MB per file</span>
                                            </div>
                                        </div>

                                        {/* Document Upload History log */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">UPLOAD HISTORY (Last 10 Days)</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                                                        <div>
                                                            <p className="font-bold text-gray-800">Aadhar.pdf → Priya Sharma</p>
                                                            <p className="text-[10px] text-gray-400">Uploaded on 22-Jun</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Verified</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-indigo-500 animate-spin">sync</span>
                                                        <div>
                                                            <p className="font-bold text-gray-800">BankStatement.pdf → Rahul Kumar</p>
                                                            <p className="text-[10px] text-gray-400">Uploaded on 21-Jun</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Processing</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-amber-500">schedule</span>
                                                        <div>
                                                            <p className="font-bold text-gray-800">IncCert_Stamped.pdf → Priya Sharma</p>
                                                            <p className="text-[10px] text-gray-400">Uploaded on 20-Jun</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Awaiting Review</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8 flex flex-col">
                                        {/* Checklist Quick View */}
                                        {selectedStudent && (
                                            <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                                <h3 className="font-display font-black text-lg text-gray-900 mb-2 uppercase tracking-tight">Student checklist</h3>
                                                <p className="text-xs text-gray-400 mb-6">{selectedStudent.firstName} {selectedStudent.lastName} — {selectedStudent.bank}</p>
                                                
                                                <div className="space-y-3.5 text-xs">
                                                    {selectedStudent.documents.map((d, i) => (
                                                        <div key={i} className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-700">{d.docName}</span>
                                                            <span className={`material-symbols-outlined text-base ${d.status === 'verified' ? 'text-emerald-500' : d.status === 'rejected' ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
                                                                {d.status === 'verified' ? 'check_circle' : d.status === 'rejected' ? 'error' : 'schedule'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Send Document Secure Upload Link */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1 flex flex-col justify-between">
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-2">SHARE SECURE UPLOAD LINK</h3>
                                                    <p className="text-gray-400 text-xs">Allows student to upload document requirements directly without signing in.</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Send To</label>
                                                        <select value={docShareState.studentId} onChange={(e) => setDocShareState({ ...docShareState, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                            {applications.map((x, i) => (
                                                                <option key={i} value={x.id}>{x.firstName} {x.lastName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Share via Channel</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {["WhatsApp", "SMS", "Email"].map((ch, i) => (
                                                                <button key={i} type="button" onClick={() => setDocShareState({ ...docShareState, channel: ch })} className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${docShareState.channel === ch ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>{ch}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6">
                                                <button onClick={handleSendDocLink} className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm">Send Secure link</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 6: CALENDAR ================= */}
                        {activeSection === "calendar" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        
                                        {/* Task View Filters */}
                                        <section className="flex gap-2 p-4 bg-white border border-[#6605c7]/10 rounded-[2rem] shadow-sm overflow-x-auto no-scrollbar">
                                            {["All", "Callback", "Doc Chase", "Bank Query", "Sanction Expiry", "Campus Event"].map((val, i) => (
                                                <button key={i} onClick={() => setCalendarFilter(val)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${calendarFilter === val ? 'bg-[#6605c7] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                                    {val}
                                                </button>
                                            ))}
                                        </section>

                                        {/* June 2026 Tasks grid */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">June 2026 — Task Schedule</h3>
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">June Month Layout</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-6 gap-3 text-center border-b border-gray-150 pb-4 mb-4">
                                                {["Mon 20", "Tue 21", "Wed 22", "Thu 23", "Fri 24", "Sat 25"].map((d, i) => (
                                                    <span key={i} className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]/50">{d}</span>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-6 gap-3 text-left">
                                                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                                    <span className="font-bold text-gray-400">20-Jun</span>
                                                    <p className="font-medium text-gray-700">Call: Rahul K.</p>
                                                </div>
                                                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                                    <span className="font-bold text-gray-400">21-Jun</span>
                                                    <p className="font-medium text-[#6605c7]">Chase: Meena P. (Docs)</p>
                                                </div>
                                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                                    <span className="font-bold text-rose-500">22-Jun (Today)</span>
                                                    <p className="font-bold text-rose-700">Priya — Bank Query Deadline!</p>
                                                </div>
                                                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                                    <span className="font-bold text-gray-400">23-Jun</span>
                                                    <p className="font-medium text-gray-700">Call: Asha R.</p>
                                                </div>
                                                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                                    <span className="font-bold text-gray-400">24-Jun</span>
                                                    <p className="font-medium text-gray-700">Meeting: IIT Campus Event</p>
                                                </div>
                                                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                                    <span className="font-bold text-gray-400">25-Jun</span>
                                                    <p className="font-medium text-gray-700">Follow-Up: Kiran Rao</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task list agenda */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">Tasks Agenda Checklist</h3>
                                            
                                            <div className="space-y-4">
                                                {filteredTasks.map((t) => (
                                                    <div key={t.id} className={`p-4 border rounded-2xl flex justify-between items-center ${t.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : t.isOverdue ? 'bg-red-50/40 border-red-150' : 'bg-gray-50/30 border-gray-100'}`}>
                                                        <div className="flex gap-3 items-start text-xs">
                                                            <button onClick={() => { setTasks(tasks.map(x => x.id === t.id ? { ...x, isCompleted: !x.isCompleted } : x)); showToast("Task status updated", "success"); }} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${t.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-indigo-600 bg-white'}`}>
                                                                {t.isCompleted && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                                            </button>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-gray-900">{t.studentName}</span>
                                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{t.type}</span>
                                                                    {t.isOverdue && !t.isCompleted && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">Overdue</span>}
                                                                </div>
                                                                <p className="text-gray-500">{t.notes}</p>
                                                                <p className="text-[10px] text-gray-400">Scheduled: {format(new Date(t.dateTime), "dd-MMM-yyyy hh:mm a")} | Alert: {t.reminder}</p>
                                                            </div>
                                                        </div>
                                                        {!t.isCompleted && (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => showToast("Snoozed callback task by 24 hours.", "info")} className="px-3 py-1.5 bg-white border border-gray-250 text-gray-500 rounded-lg text-[9px] font-bold hover:bg-gray-50">Snooze</button>
                                                                <button onClick={() => { setTasks(tasks.map(x => x.id === t.id ? { ...x, isCompleted: true } : x)); showToast("Task marked completed.", "success"); }} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600">Done</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add task scheduler form */}
                                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">+ Add New Task</h3>
                                                <p className="text-gray-400 text-xs mt-1">Schedule personal callback reminders, document chases, or meeting callbacks.</p>
                                            </div>

                                            <form onSubmit={handleAddTask} className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Task Type</label>
                                                    <select value={newTaskForm.type} onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                        <option>Callback</option>
                                                        <option>Doc Chase</option>
                                                        <option>Bank Query</option>
                                                        <option>Sanction Expiry</option>
                                                        <option>Campus Event</option>
                                                        <option>Student Callback</option>
                                                        <option>New Lead Follow-Up</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Target Student</label>
                                                    <select value={newTaskForm.studentId} onChange={(e) => setNewTaskForm({ ...newTaskForm, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                        <option value="">Choose student...</option>
                                                        {applications.map((x, i) => (
                                                            <option key={i} value={x.id}>{x.firstName} {x.lastName}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Date & Time</label>
                                                    <input type="datetime-local" value={newTaskForm.dateTime} onChange={(e) => setNewTaskForm({ ...newTaskForm, dateTime: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none" />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Alert / Reminder Timing</label>
                                                    <select value={newTaskForm.reminder} onChange={(e) => setNewTaskForm({ ...newTaskForm, reminder: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                                        <option>15 min before</option>
                                                        <option>1 hour before</option>
                                                        <option>1 day before</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Internal Notes</label>
                                                    <textarea value={newTaskForm.notes} onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none h-24" placeholder="Reminder task summary details..." />
                                                </div>

                                                <button type="submit" className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm">Save Task Reminder</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 7: COMMISSIONS ================= */}
                        {activeSection === "commissions" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                {/* Earnings Overview Table */}
                                <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">My Earnings Summary</h3>
                                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-wider">Next Payout: 01-Jul-2026</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-bold border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                                    <th className="p-4">Period</th>
                                                    <th className="p-4">Gross Commission</th>
                                                    <th className="p-4">TDS Deducted (10%)</th>
                                                    <th className="p-4">Net Payable</th>
                                                    <th className="p-4">Payout Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                <tr>
                                                    <td className="p-4">June 2026</td>
                                                    <td className="p-4 font-mono">₹72,000</td>
                                                    <td className="p-4 text-rose-500 font-mono">(₹7,200)</td>
                                                    <td className="p-4 font-black text-emerald-600 font-mono">₹64,800</td>
                                                    <td className="p-4"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] uppercase tracking-wider font-black">⏳ Pending Approval (Admin reviews 1st)</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="p-4">May 2026</td>
                                                    <td className="p-4 font-mono">₹60,000</td>
                                                    <td className="p-4 text-rose-500 font-mono">(₹6,000)</td>
                                                    <td className="p-4 font-black text-gray-700 font-mono">₹54,000</td>
                                                    <td className="p-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] uppercase tracking-wider font-black">✅ Paid (01-Jun)</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="p-4">YTD (Jan–Jun)</td>
                                                    <td className="p-4 font-mono">₹3,84,000</td>
                                                    <td className="p-4 text-rose-500 font-mono">(₹38,400)</td>
                                                    <td className="p-4 font-black text-gray-700 font-mono">₹3,45,600</td>
                                                    <td className="p-4"><span className="text-gray-400 font-bold uppercase text-[9px]">Combined Ledger</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* Commission breakdown ledger */}
                                <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Commission Student Ledger — June 2026</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => downloadCSV()} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-500 hover:bg-gray-150">Export Excel</button>
                                            <button onClick={() => downloadPDF()} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100">Download Statement</button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-bold border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                                    <th className="p-4">Student Name</th>
                                                    <th className="p-4">Bank</th>
                                                    <th className="p-4">Disbursed Amount</th>
                                                    <th className="p-4">Commission Rate</th>
                                                    <th className="p-4">Total Commission</th>
                                                    <th className="p-4">Payout Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {applications.slice(0, 5).map((app, i) => (
                                                    <tr key={i}>
                                                        <td className="p-4 font-bold text-gray-800">{app.firstName} {app.lastName}</td>
                                                        <td className="p-4">{app.bank}</td>
                                                        <td className="p-4 font-mono">₹{app.amount.toLocaleString()}</td>
                                                        <td className="p-4 font-mono">{app.commissionRate}%</td>
                                                        <td className="p-4 font-black text-[#6605c7] font-mono">₹{app.projectedCommission.toLocaleString()}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${app.status === 'disbursed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                {app.status === 'disbursed' ? 'Paid' : 'Pending Sanction'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* Commissions splits / rate cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Payout History logs */}
                                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                        <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">Payout History (Last 5 Months)</h3>
                                        
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-800">May 2026 Payout</p>
                                                    <p className="text-[10px] text-gray-400">Paid 01-Jun-2026 | UTR12345</p>
                                                </div>
                                                <span className="font-mono font-black text-gray-900">₹54,000</span>
                                            </div>
                                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-800">Apr 2026 Payout</p>
                                                    <p className="text-[10px] text-gray-400">Paid 01-May-2026 | UTR12298</p>
                                                </div>
                                                <span className="font-mono font-black text-gray-900">₹43,200</span>
                                            </div>
                                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-800">Mar 2026 Payout</p>
                                                    <p className="text-[10px] text-gray-400">Paid 01-Apr-2026 | UTR11990</p>
                                                </div>
                                                <span className="font-mono font-black text-gray-900">₹64,800</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commission rate card */}
                                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                        <h3 className="font-display font-black text-lg text-gray-900 mb-2 uppercase tracking-tight">Commission Rate Card</h3>
                                        <p className="text-xs text-gray-400 mb-6">Current Tier: Master Tier 🥇 (+0.20% bonus structure)</p>
                                        
                                        <div className="space-y-4 text-xs font-bold text-gray-700">
                                            <div className="flex justify-between border-b border-gray-50 pb-2.5">
                                                <span className="text-gray-400">Domestic Loan &lt; ₹10L</span>
                                                <span>0.70% (0.50% Base + 0.20% Bonus)</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-2.5">
                                                <span className="text-gray-400">Domestic Loan ₹10L–₹20L</span>
                                                <span>0.80% (0.60% Base + 0.20% Bonus)</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-2.5">
                                                <span className="text-gray-400">Domestic Loan &gt; ₹20L</span>
                                                <span>0.95% (0.75% Base + 0.20% Bonus)</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-2.5">
                                                <span className="text-gray-400">Abroad Loan (Any amount)</span>
                                                <span>1.00% (0.80% Base + 0.20% Bonus)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Collateral Loan</span>
                                                <span>0.60% (0.40% Base + 0.20% Bonus)</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                                            Next Milestone: FRANCHISE (26+ sanctions/month) → Unlock White-Label Portal & Highest Rates
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 8: PERFORMANCE REPORT ================= */}
                        {activeSection === "analytics" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        
                                        {/* Funnel chart diagram */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Conversion Funnel Analytics</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <span className="w-32 text-xs font-bold text-gray-500 uppercase">Submitted Leads</span>
                                                    <div className="flex-1 h-8 bg-indigo-100 border border-indigo-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-indigo-700">48 Leads (100%)</div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-32 text-xs font-bold text-gray-500 uppercase">Docs Received</span>
                                                    <div className="flex-1 h-8 bg-[#6605c7]/10 border border-[#6605c7]/20 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-[#6605c7]" style={{ maxWidth: "80%" }}>38 Leads (79%)</div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-32 text-xs font-bold text-gray-500 uppercase">AI Verified</span>
                                                    <div className="flex-1 h-8 bg-[#8b24e5]/10 border border-[#8b24e5]/20 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-[#8b24e5]" style={{ maxWidth: "67%" }}>32 Leads (67%)</div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-32 text-xs font-bold text-gray-500 uppercase">Sent to Bank</span>
                                                    <div className="flex-1 h-8 bg-amber-100 border border-amber-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-amber-700" style={{ maxWidth: "48%" }}>23 Leads (48%)</div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-32 text-xs font-bold text-gray-500 uppercase">Sanctioned</span>
                                                    <div className="flex-1 h-8 bg-emerald-100 border border-emerald-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-emerald-700" style={{ maxWidth: "25%" }}>12 Leads (25%)</div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium mt-6">
                                                💡 Your conversion rate (25%) is above the industry average (18%) — Great job! Largest drop occurs from "Sent to Bank" to "Sanctioned", typically due to missing physical stamped Income certificates.
                                            </div>
                                        </div>

                                        {/* Bank performance TAT reports */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Bank Performance & TAT Report</h3>
                                            
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs font-bold border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                                            <th className="p-4">Bank</th>
                                                            <th className="p-4">Submitted Leads</th>
                                                            <th className="p-4">Sanctioned</th>
                                                            <th className="p-4">TAT Average</th>
                                                            <th className="p-4">Approval Rate</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        <tr>
                                                            <td className="p-4">SBI</td>
                                                            <td className="p-4">10</td>
                                                            <td className="p-4">7</td>
                                                            <td className="p-4 text-amber-600">12 Days</td>
                                                            <td className="p-4 font-black">70%</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-4">HDFC Credila</td>
                                                            <td className="p-4">7</td>
                                                            <td className="p-4">4</td>
                                                            <td className="p-4 text-gray-600">9 Days</td>
                                                            <td className="p-4 font-black">57%</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-4">Avanse</td>
                                                            <td className="p-4">4</td>
                                                            <td className="p-4">3</td>
                                                            <td className="p-4 text-emerald-600 font-bold">6 Days 🏆</td>
                                                            <td className="p-4 font-black text-emerald-600">75%</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leaderboards and Rejections */}
                                    <div className="space-y-8 flex flex-col">
                                        {/* Leaderboard */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">🥇 Territory Leaderboard (June 2026)</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex justify-between items-center text-xs">
                                                    <div className="flex gap-3 items-center">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</span>
                                                        <span className="font-black text-indigo-700">Krishna Agency (You)</span>
                                                    </div>
                                                    <span className="font-bold text-indigo-700">12 sanctions</span>
                                                </div>
                                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                                    <div className="flex gap-3 items-center">
                                                        <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">2</span>
                                                        <span className="font-bold text-gray-800">Sai Associates</span>
                                                    </div>
                                                    <span className="font-bold text-gray-600">7 sanctions</span>
                                                </div>
                                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                                    <div className="flex gap-3 items-center">
                                                        <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">3</span>
                                                        <span className="font-bold text-gray-800">Edu Advisors HYD</span>
                                                    </div>
                                                    <span className="font-bold text-gray-600">3 sanctions</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rejections Reasons */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">REJECTION ANALYSIS</h3>
                                            
                                            <div className="space-y-4 text-xs">
                                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                    <div className="flex justify-between font-bold text-gray-800">
                                                        <span>Incomplete Documents</span>
                                                        <span>44% (4 counts)</span>
                                                    </div>
                                                    <p className="text-rose-500 text-[10px] font-medium mt-1">Fix: Use checklists before upload</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                    <div className="flex justify-between font-bold text-gray-800">
                                                        <span>Low Co-Applicant Income</span>
                                                        <span>22% (2 counts)</span>
                                                    </div>
                                                    <p className="text-indigo-600 text-[10px] font-medium mt-1">Fix: Evaluate checker tool prior to lead submit</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 9: SUB-AGENTS ================= */}
                        {activeSection === "sub_agents" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Sub-agent Network Table */}
                                    <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Active Sub-Agent Network</h3>
                                        
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-bold border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                                        <th className="p-4">Sub-Agent Name</th>
                                                        <th className="p-4">Territory</th>
                                                        <th className="p-4">Leads Month</th>
                                                        <th className="p-4">Sanctions</th>
                                                        <th className="p-4">Their 60% Split</th>
                                                        <th className="p-4">Your 40% Cut</th>
                                                        <th className="p-4">LMS Progress</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {subAgents.map((sa, i) => (
                                                        <tr key={i}>
                                                            <td className="p-4 font-bold text-gray-800">{sa.name}</td>
                                                            <td className="p-4">{sa.territory}</td>
                                                            <td className="p-4 text-center">{sa.leadsThisMonth}</td>
                                                            <td className="p-4 text-center">{sa.sanctionsThisMonth}</td>
                                                            <td className="p-4 font-mono text-gray-600">₹{sa.theirCut.toLocaleString()}</td>
                                                            <td className="p-4 font-mono font-black text-indigo-600">₹{sa.myCut.toLocaleString()}</td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-emerald-500" style={{ width: `${(sa.trainingCompleted / sa.totalTraining) * 100}%` }} />
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400">{sa.trainingCompleted}/{sa.totalTraining}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-xs font-bold uppercase tracking-wider text-center mt-6">
                                            Your Override Override Commission from Sub-Agents: ₹14,000 (included in June Net Payable Payout)
                                        </div>
                                    </div>

                                    {/* Invite Sub-agent Form */}
                                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Invite Sub-Agent</h3>
                                        
                                        <form onSubmit={handleInviteSubAgent} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Sub-Agent Name</label>
                                                <input type="text" required value={inviteSubAgentForm.name} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
                                                <input type="tel" required value={inviteSubAgentForm.mobile} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, mobile: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                                                <input type="email" required value={inviteSubAgentForm.email} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Territory Scope</label>
                                                <input type="text" value={inviteSubAgentForm.territory} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, territory: e.target.value })} placeholder="e.g. Nizamabad" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                            </div>
                                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">
                                                Commission Split: 60% (Sub-Agent) / 40% (You) — Fixed by Vidyaloans
                                            </div>

                                            <button type="submit" className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm">Send Invitation Link</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= MODULE 10: TRAINING & LMS ================= */}
                        {activeSection === "training" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        
                                        {/* LMS modules checklists */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Agent Learning Center (LMS)</h3>
                                            
                                            <div className="divide-y divide-gray-50">
                                                {lmsModules.map((m, i) => (
                                                    <div key={i} className="py-4 flex justify-between items-center text-xs">
                                                        <div>
                                                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{m.category}</span>
                                                            <p className="font-black text-gray-900 mt-1">{m.title}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {m.completed ? (
                                                                <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">verified</span> Passed ({m.score}%)</span>
                                                            ) : (
                                                                <button onClick={() => showToast(`Module launched. Simulation starting.`, "info")} className="px-4 py-2 bg-indigo-50 hover:bg-[#6605c7] hover:text-white text-[#6605c7] font-black uppercase tracking-wider rounded-xl transition-all">Launch</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Reference library downloads */}
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">QUICK REFERENCE LIBRARY</h3>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button onClick={() => showToast("College List PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Approved College List (Bank-wise)
                                                </button>
                                                <button onClick={() => showToast("Product sheet comparison PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Bank Product Comparison Sheet
                                                </button>
                                                <button onClick={() => showToast("Document checklist Domestic PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Document Checklist (Domestic Loans)
                                                </button>
                                                <button onClick={() => showToast("Document checklist Abroad PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Document Checklist (Abroad Loans)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Knowledge Bot Widget */}
                                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[460px]">
                                        <div className="flex flex-col h-full justify-between">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">AI Knowledge Assistant</h3>
                                                    <p className="text-gray-400 text-xs mt-1">Resolve eligibility criteria questions dynamically.</p>
                                                </div>

                                                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 min-h-[220px] max-h-[240px] overflow-y-auto space-y-3.5 no-scrollbar flex flex-col">
                                                    {botMessages.map((m, i) => (
                                                        <div key={i} className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${m.sender === 'user' ? 'bg-[#6605c7] text-white self-end rounded-tr-none' : 'bg-white border border-gray-150 text-gray-700 self-start rounded-tl-none'}`}>
                                                            {m.text}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <form onSubmit={handleAskBot} className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                                                <input type="text" value={botInput} onChange={(e) => setBotInput(e.target.value)} placeholder="e.g. Which banks accept partial collateral?" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 focus:outline-none" />
                                                <button type="submit" className="w-11 h-11 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-base">send</span>
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= CHAT PORTALS STAFF & STUDENT ================= */}
                        {activeSection === "chat_staff" && <ChatInterface role="staff" initialUser={null} portalTitle="Support Central" />}
                        {activeSection === "chat_student" && <ChatInterface role="agent" initialUser={autoStartUser} portalTitle="Student Pipeline" />}
                    </div>
                </div>
            </main>
        </div>
    );
}
