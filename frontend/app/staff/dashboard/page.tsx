"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, authApi, documentApi, onboardingApi, staffProfileApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";
import ApplicantsSection from "@/components/staff/ApplicantsSection";
import PullDocumentsModal from "@/components/staff/PullDocumentsModal";
import ApplicationDetailView from "@/components/staff/ApplicationDetailView";
import { getAllCountries, getStatesByCountry } from "@/lib/countriesData";
import { formatPhone, formatAadhar, formatPan, isPhoneValid, isAadharValid, isPanValid } from "@/lib/validation";
import { getS3PresignedUrl, uploadFileToS3, completeDocumentUpload } from "@/lib/s3-utils";

// --- Components ---

const StatCard = ({ label, value, icon, color, trend, loading, hint }: any) => (
    <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm group hover:border-indigo-200 transition-colors">
        <div className="flex justify-between items-start mb-3">
            <div className={`w-8 h-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 ${color?.includes('text-') ? color : 'text-slate-600'}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </div>
            {hint && !loading && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">{hint}</span>
            )}
            {trend !== undefined && !loading && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className="material-symbols-outlined text-[12px]">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-[11px] font-medium mb-0.5">{label}</p>
            <div className="text-[20px] font-semibold text-slate-900 tracking-tight">
                {loading ? <span className="h-6 bg-slate-100 animate-pulse rounded block w-16" /> : value ?? "—"}
            </div>
        </div>
    </div>
);

const NavItem = ({ section, active, icon, label, badge, onClick }: any) => {
    const isActive = active === section;
    return (
        <button
            onClick={() => onClick(section)}
            title={label}
            className={`relative w-full flex items-center gap-3 px-3 transition-all duration-150 group/item ${isActive
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-200'
                }`}
            style={{ height: 44 }}
        >
            {isActive && (
                <span className="absolute inset-x-1 inset-y-1 rounded-lg bg-indigo-600" />
            )}
            {/* Icon — always visible */}
            <span className={`material-symbols-outlined text-[24px] relative z-10 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-slate-200'
                }`}>{icon}</span>
            {/* Label — hidden at 56px, fades in when parent sidebar is hovered */}
            <span className={`relative z-10 text-[16px] font-['Playfair_Display',serif] tracking-wider whitespace-nowrap overflow-hidden transition-all duration-200
                opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto
                ${isActive ? 'text-white font-medium' : 'text-slate-300'}`}>
                {label}
            </span>
            {badge > 0 && (
                <span className={`relative z-10 ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    bg-rose-500 text-white
                    opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200`}>
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </button>
    );
};

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest font-['Playfair_Display',serif] font-bold text-left">
        <tr>{children}</tr>
    </thead>
);

export default function StaffDashboardPage() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [data, setData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [autoStartUser, setAutoStartUser] = useState<any>(null);
    const [showPullModal, setShowPullModal] = useState(false);
    const [recentActivity] = useState([
        { id: 1, type: "approved", msg: "Application #APP-1021 approved", time: "2m ago", icon: "check_circle", color: "text-emerald-600 bg-emerald-50" },
        { id: 2, type: "new", msg: "New applicant Rahul Sharma onboarded", time: "18m ago", icon: "person_add", color: "text-indigo-600 bg-indigo-50" },
        { id: 3, type: "pending", msg: "3 documents awaiting review for #APP-1018", time: "1h ago", icon: "hourglass_empty", color: "text-amber-600 bg-amber-50" },
        { id: 4, type: "chat", msg: "Bank HDFC sent a query on #APP-1015", time: "2h ago", icon: "chat", color: "text-blue-600 bg-blue-50" },
        { id: 5, type: "rejected", msg: "Application #APP-1009 rejected — docs missing", time: "3h ago", icon: "cancel", color: "text-rose-600 bg-rose-50" },
    ]);

    // Real-time updates
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

    // Tasks State
    const [tasks, setTasks] = useState([
        { id: 1, title: "Review pending applications from HDFC", completed: false },
        { id: 2, title: "Follow up with Student #8921 on missing documents", completed: false },
        { id: 3, title: "Sync with Bank representative regarding SLA", completed: true },
    ]);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // Email / Communications
    const [emailData, setEmailData] = useState({ to: "", subject: "", content: "", role: "user", isBulk: false });
    const [emailLoading, setEmailLoading] = useState(false);

    // Application detail modal state
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [userRoleFilter, setUserRoleFilter] = useState("all");

    const [onboardMode, setOnboardMode] = useState<"new" | "link">("new");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

    // Fetch suggestions as user types for "Link Existing"
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (onboardMode === 'link' && userSearchQuery.trim().length >= 2) {
                setIsSearchingSuggestions(true);
                try {
                    const res: any = await adminApi.getUsers(5, 0, userSearchQuery.trim());
                    const users = res.data || [];
                    setUserSuggestions(users.sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()));
                } catch (e) {
                    console.error("Failed to fetch suggestions", e);
                } finally {
                    setIsSearchingSuggestions(false);
                }
            } else {
                setUserSuggestions([]);
            }
        };

        const timer = setTimeout(fetchSuggestions, 400);
        return () => clearTimeout(timer);
    }, [userSearchQuery, onboardMode]);

    // Validation Helpers removed - using shared lib

    // Helper function to generate required documents based on employment type
    const getRequiredDocuments = (employmentType: string, personName: string, personType: 'father' | 'mother' | 'coapplicant') => {
        const docs: any[] = [];
        
        const typePrefix = personType === 'father' ? 'father' : personType === 'mother' ? 'mother' : 'coapplicant';
        
        // Aadhar and PAN - separately required
        docs.push({ name: `${personName}'s Aadhar Card`, type: `${typePrefix}_aadhar`, required: true });
        docs.push({ name: `${personName}'s PAN Card`, type: `${typePrefix}_pan`, required: true });
        
        // Employment-specific documents
        if (employmentType === 'employed') {
            docs.push({ name: `${personName} - Last 3 months Salary Slips`, type: `${typePrefix}_salary_slips`, required: true });
            docs.push({ name: `${personName} - Last 6 months Bank Statements`, type: `${typePrefix}_bank_statements`, required: true });
        } else if (employmentType === 'self_employed_business' || employmentType === 'self_employed_professional') {
            docs.push({ name: `${personName} - Business Registration/License`, type: `${typePrefix}_business_license`, required: true });
            docs.push({ name: `${personName} - Labour License (if applicable)`, type: `${typePrefix}_labour_license`, required: false });
            docs.push({ name: `${personName} - Udyam Certificate`, type: `${typePrefix}_udyam_cert`, required: false });
            docs.push({ name: `${personName} - Last 6 months Bank Statements`, type: `${typePrefix}_bank_statements`, required: true });
            docs.push({ name: `${personName} - Last 2 years ITR (Income Tax Returns)`, type: `${typePrefix}_itr`, required: true });
            docs.push({ name: `${personName} - Balance Sheet & P&L Statement`, type: `${typePrefix}_balance_sheet`, required: false });
        } else if (employmentType === 'retired') {
            docs.push({ name: `${personName} - Retirement Certificate/Pension Document`, type: `${typePrefix}_retirement_cert`, required: true });
            docs.push({ name: `${personName} - Last 6 months Bank Statements`, type: `${typePrefix}_bank_statements`, required: true });
        }
        
        return docs;
    };

    // Onboard applicant — two-step state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [onboardStep, setOnboardStep] = useState<1 | 2 | 3>(1);
    const [createdUser, setCreatedUser] = useState<any>(null);
    const [quickForm, setQuickForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
    const [profileTab, setProfileTab] = useState<"personal" | "academic" | "work" | "tests" | "family">("personal");
    const [newStudent, setNewStudent] = useState({
        email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "student",
        dob: "", gender: "", maritalStatus: "",
        mailingAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        permanentAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        passport: { number: "", issueDate: "", expiryDate: "", issueCountry: "", birthCity: "", birthCountry: "" },
        nationality: { name: "", citizenship: "", dualCitizenship: "No", livingOtherCountry: "No", livingOtherCountryName: "" },
        background: { immigrationApplied: "No", immigrationAppliedCountry: "", medicalCondition: "No", medicalConditionDetails: "", visaRefusal: "No", visaRefusalDetails: "", criminalOffence: "No", criminalOffenceDetails: "" },
        emergencyContact: { name: "", phone: "", email: "", relation: "" },
        academic: {
            countryOfEducation: "",
            highestLevel: "",
            postgrad: { country: "", state: "", university: "", qualification: "", city: "", grading: "", percentage: "", language: "", startDate: "", endDate: "" },
            undergrad: { country: "", state: "", university: "", qualification: "", city: "", grading: "", score: "", backlogs: "", language: "", startDate: "", endDate: "" },
            grade12: { country: "", state: "", board: "", institution: "", city: "", grading: "", score: "", language: "", startDate: "", endDate: "" },
            grade10: { country: "", state: "", board: "", institution: "", city: "", grading: "", score: "", language: "", startDate: "", endDate: "" }
        },
        workExperience: [{ employer: "", role: "", country: "", startDate: "", endDate: "", current: false }],
        tests: { ielts: "", toefl: "", pte: "", gre: "", gmat: "", sat: "" },
        family: {
            fatherName: "", fatherMobile: "", fatherEmail: "", fatherOccupation: "", fatherAadhar: "", fatherPan: "",
            fatherEmploymentType: "", fatherMonthlyIncome: "",
            motherName: "", motherMobile: "", motherEmail: "", motherOccupation: "", motherAadhar: "", motherPan: "",
            motherEmploymentType: "", motherMonthlyIncome: "",
        },
        coApplicant: {
            name: "", mobile: "", email: "", relation: "", occupation: "", aadhar: "", pan: "",
            employmentType: "", monthlyIncome: "",
            isSameAsFather: false, isSameAsMother: false
        }
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Document state
    const [userDocuments, setUserDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState<{ [key: string]: number }>({});
    const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
    const [s3Documents, setS3Documents] = useState<any[]>([]);
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [blogStats, appStats, userStats]: [any, any, any] = await Promise.all([
                adminApi.getBlogStats().catch(() => ({ data: {} })),
                adminApi.getApplicationStats().catch(() => ({ data: {} })),
                adminApi.getUsers().catch(() => ({ data: [] }))
            ]);

            setStats({
                blogs: blogStats.data || {},
                apps: appStats.data || {},
                users: { total: userStats.data?.length || 0 }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        if (activeSection === "overview" || activeSection.startsWith("chat_")) return;
        setLoading(true);
        setData([]);
        try {
            let res: any;
            if (activeSection === "blogs") {
                res = await adminApi.getBlogs({ limit: '100' });
                setData(Array.isArray(res) ? res : (res.data || []));
            } else if (activeSection === "applications") {
                const params: any = {};
                if (filterStatus !== "all") params.status = filterStatus;
                res = await adminApi.getApplications(params);
                setData(Array.isArray(res) ? res : (res.data || []));
            } else if (activeSection === "community") {
                res = await adminApi.getForumPosts(50);
                setData(Array.isArray(res) ? res : (res.data || []));
            } else if (activeSection === "users") {
                res = await adminApi.getUsers();
                setData(Array.isArray(res) ? res : (res.data || []));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeSection, filterStatus]);

    useEffect(() => {
        if (activeSection === "overview") loadOverview();
        else loadData();
    }, [activeSection, loadOverview, loadData]);

    // Pre-calculate stats for different sections to avoid complex IIFEs in JSX
    const userStatsData = activeSection === 'users' ? (() => {
        const total = data.length;
        const students = data.filter((u: any) => u.role === 'user' || u.role === 'student').length;
        const bankPartners = data.filter((u: any) => u.role === 'bank').length;
        const staffMembers = data.filter((u: any) => u.role === 'staff' || u.role === 'staff_admin').length;
        const admins = data.filter((u: any) => u.role?.includes('admin')).length;
        return [
            { id: 'all', label: 'Total Users', value: total, icon: 'group', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tag: 'ACTIVE' },
            { id: 'student', label: 'Student Accounts', value: students, icon: 'school', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'ROLE' },
            { id: 'bank', label: 'Bank Partners', value: bankPartners, icon: 'account_balance', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tag: 'ROLE' },
            { id: 'staff', label: 'Staff Members', value: staffMembers, icon: 'badge', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', tag: 'O_ADMIN' },
            { id: 'admin', label: 'Admins', value: admins, icon: 'admin_panel_settings', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tag: 'ADMIN' },
        ];
    })() : [];

    const blogStatsData = activeSection === 'blogs' ? (() => {
        const total = data.length;
        const published = data.filter((b: any) => b.isPublished).length;
        const drafts = total - published;
        const totalViews = data.reduce((acc: number, b: any) => acc + (b.views || 0), 0);
        return [
            { label: 'Total Posts', value: total, icon: 'article', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tag: 'ALL' },
            { label: 'Published', value: published, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'LIVE' },
            { label: 'Drafts', value: drafts, icon: 'edit_note', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tag: 'WORK' },
            { label: 'Total Engagement', value: totalViews, icon: 'visibility', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tag: 'VIEWS' },
            { label: 'Avg Read Time', value: '4m', icon: 'timer', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', tag: 'METRIC' },
        ];
    })() : [];

    const communityStatsData = activeSection === 'community' ? (() => {
        const total = data.length;
        const activeThreads = data.filter((t: any) => !t.isClosed).length;
        const totalLikes = data.reduce((acc: number, t: any) => acc + (t.likes?.length || 0), 0);
        return [
            { label: 'Active Topics', value: total, icon: 'forum', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tag: 'HUB' },
            { label: 'Open Threads', value: activeThreads, icon: 'bolt', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'LIVE' },
            { label: 'Total Reactions', value: totalLikes, icon: 'favorite', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tag: 'SOCIAL' },
            { label: 'New Replies', value: '12', icon: 'chat', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tag: '24H' },
            { label: 'Moderation', value: '0', icon: 'gavel', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tag: 'PENDING' },
        ];
    })() : [];

    // Auto-refresh for real-time updates
    useEffect(() => {
        if (!autoRefreshEnabled) return;

        if (activeSection === "overview") {
            // Refresh overview every 20 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadOverview();
                setLastRefresh(new Date());
            }, 20000);
        } else if (activeSection === "applications") {
            // Refresh applications every 15 seconds for real-time pipeline
            autoRefreshInterval.current = setInterval(() => {
                loadData();
                setLastRefresh(new Date());
            }, 15000);
        } else if (activeSection === "performance") {
            // Refresh metrics every 30 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadOverview();
                setLastRefresh(new Date());
            }, 30000);
        } else if (activeSection === "users") {
            // Refresh users every 25 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadData();
                setLastRefresh(new Date());
            }, 25000);
        }

        return () => {
            if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current);
        };
    }, [activeSection, autoRefreshEnabled, loadOverview, loadData]);

    const handleAppStatus = async (appId: string, status: string) => {
        setActionLoading(true);
        try {
            await adminApi.updateApplicationStatus(appId, {
                status,
                remarks: actionRemarks || undefined,
            });
            setSelectedApp(null);
            setActionRemarks("");
            loadData();
            loadOverview();
        } catch (e) {
            alert("Failed to update application status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailData.subject || !emailData.content) { alert("Subject and content are required"); return; }
        setEmailLoading(true);
        try {
            await adminApi.sendEmail(emailData);
            alert("Email sent successfully");
            setEmailData({ to: "", subject: "", content: "", role: "user", isBulk: false });
        } catch (e: any) {
            alert("Failed to send email: " + e.message);
        } finally { setEmailLoading(false); }
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = () => {
        if (!newTaskTitle.trim()) return;
        setTasks([{ id: Date.now(), title: newTaskTitle, completed: false }, ...tasks]);
        setNewTaskTitle("");
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const resetOnboardModal = () => {
        setActiveSection('overview');
        setOnboardStep(1);
        setCreatedUser(null);
        setQuickForm({ firstName: "", lastName: "", email: "", phone: "" });
        setProfileTab("personal");
        setOnboardMode('new');
        setUserSearchQuery("");
    };

    const handleCheckEmailAndLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userSearchQuery) return;
        setIsSearchingUsers(true);
        try {
            // Use res.data as the backend returns 'data' array
            const res: any = await adminApi.getUsers(20, 0, userSearchQuery.trim());
            const user = res.data?.find((u: any) => u.email.toLowerCase() === userSearchQuery.trim().toLowerCase());

            if (user) {
                handleLinkExistingUser(user);
            } else {
                alert("No student found with this exact email address. Please select from suggestions or register as a new applicant.");
            }
        } catch (e) {
            console.error("Check email failed", e);
            alert("Failed to verify user. Please try again.");
        } finally {
            setIsSearchingUsers(false);
        }
    };

    const handleLinkExistingUser = async (user: any) => {
        setCreatedUser(user);
        setNewStudent(s => ({
            ...s,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            mobile: user.mobile || user.phone || "",
            dob: user.dateOfBirth || "",
        }));

        // Check if StaffProfile exists first to prevent 409 Conflict error
        try {
            const userId = user.id || user._id || user.uid;
            if (userId) {
                const checkRes: any = await staffProfileApi.checkExists(userId);
                if (!checkRes.exists) {
                    await staffProfileApi.create({
                        linked_user_id: userId,
                        internal_notes: `Staff-initiated link for existing user ${user.firstName}`
                    });
                }
            }
        } catch (spErr) {
            console.warn("Staff profile check/creation failed", spErr);
        }

        setOnboardStep(2);
    };

    const handleQuickRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickForm.firstName || !quickForm.lastName || !quickForm.email || !quickForm.phone) return;
        setCreateLoading(true);
        try {
            const res: any = await adminApi.createUser({
                firstName: quickForm.firstName,
                lastName: quickForm.lastName,
                email: quickForm.email,
                mobile: quickForm.phone,
                role: "student",
            });

            console.log("Create User Response Full:", JSON.stringify(res, null, 2));
            console.log("Response keys:", Object.keys(res || {}));

            // Handle different possible response structures
            const user = res?.user || (Array.isArray(res?.data) ? res.data[0] : res.data) || res;
            console.log("Extracted user object:", JSON.stringify(user, null, 2));
            console.log("User object keys:", Object.keys(user || {}));

            const userId = user?.id || user?.uid || user?._id;
            console.log("Extracted userId:", userId);

            if (!userId) {
                console.error("Failed to extract user ID. Response structure:", {
                    hasUser: !!res?.user,
                    userKeys: Object.keys(res?.user || {}),
                    hasData: !!res?.data,
                    hasId: !!user?.id,
                    hasUid: !!user?.uid,
                    has_id: !!user?._id,
                    responseObj: res
                });
                throw new Error("User created but no valid ID returned from server. Response: " + JSON.stringify(res));
            }

            setCreatedUser(user);
            setNewStudent(s => ({ ...s, firstName: quickForm.firstName, lastName: quickForm.lastName, email: quickForm.email, mobile: quickForm.phone }));

            // Create a StaffProfile for this user to enable document fetching/syncing
            try {
                await staffProfileApi.create({
                    linked_user_id: userId,
                    internal_notes: `Staff-initiated onboarding for ${quickForm.firstName}`
                });
            } catch (spErr) {
                console.warn("Staff profile creation failed", spErr);
            }

            setOnboardStep(2);
        } catch (e: any) {
            alert(e.message || "Failed to register applicant");
        } finally {
            setCreateLoading(false);
        }
    };

    // Auto-fetch documents when entering step 3
    useEffect(() => {
        if (onboardStep === 3 && createdUser) {
            const userId = createdUser.id || createdUser.uid || createdUser._id;
            if (userId) fetchUserDocuments(userId);
        }
    }, [onboardStep, createdUser]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation checks
        if (!isPhoneValid(newStudent.mobile)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        setCreateLoading(true);
        try {
            await adminApi.updateUserDetails({
                email: newStudent.email,
                firstName: newStudent.firstName,
                lastName: newStudent.lastName,
                phoneNumber: newStudent.mobile,
                dateOfBirth: newStudent.dob,
            });
            loadData();
            setProfileTab('academic');
            alert(`✅ Personal Information for ${newStudent.firstName} saved! Please complete academic details.`);
        } catch (e: any) {
            alert(e.message || "Failed to save profile");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleFinalOnboardSubmit = async () => {
        // Global validation check before final submission
        if (newStudent.family.fatherMobile && !isPhoneValid(newStudent.family.fatherMobile)) {
            alert("Invalid Father's Mobile Number.");
            return;
        }
        if (newStudent.family.fatherAadhar && !isAadharValid(newStudent.family.fatherAadhar)) {
            alert("Invalid Father's Aadhar Number.");
            return;
        }
        if (newStudent.family.fatherPan && !isPanValid(newStudent.family.fatherPan)) {
            alert("Invalid Father's PAN Number.");
            return;
        }
        
        if (newStudent.family.motherMobile && !isPhoneValid(newStudent.family.motherMobile)) {
            alert("Invalid Mother's Mobile Number.");
            return;
        }
        
        if (newStudent.coApplicant.name) {
            if (newStudent.coApplicant.mobile && !isPhoneValid(newStudent.coApplicant.mobile)) {
                alert("Invalid Co-applicant Mobile Number.");
                return;
            }
        }

        setCreateLoading(true);
        try {
            await onboardingApi.submit(newStudent);
            alert("🎉 Onboarding complete! Applicant profile has been fully updated.");
            resetOnboardModal();
            loadData();
        } catch (e: any) {
            alert("Failed to finalize onboarding: " + e.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const fetchUserDocuments = async (userId: string) => {
        setDocsLoading(true);
        try {
            const res: any = await documentApi.getUsersDocuments(userId);
            setUserDocuments(res?.data || res || []);
        } catch (e) {
            console.error("Failed to load documents");
        } finally {
            setDocsLoading(false);
        }
    };

    // Handle S3 document upload
    const handleS3DocumentUpload = async (
        file: File,
        docType: string,
        personType: 'applicant' | 'father' | 'mother' | 'coapplicant',
        personName: string,
        employmentType?: string
    ) => {
        const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
        if (!userId) {
            alert('User ID not found');
            return;
        }

        const uploadKey = `${docType}-${personType}`;
        setUploadingDocs(prev => ({ ...prev, [uploadKey]: 0 }));
        setUploadErrors(prev => ({ ...prev, [uploadKey]: '' }));

        try {
            // Step 1: Get presigned URL
            const { uploadUrl, s3Key, docId } = await getS3PresignedUrl(userId, docType, file.name, file.type);

            // Step 2: Upload file to S3
            await uploadFileToS3(file, uploadUrl, s3Key, (progress) => {
                setUploadingDocs(prev => ({ ...prev, [uploadKey]: progress }));
            });

            // Step 3: Complete upload in database
            const response = await completeDocumentUpload(
                userId,
                docId,
                docType,
                s3Key,
                uploadUrl.split('?')[0],
                personType,
                employmentType
            );

            // Update local state
            setS3Documents(prev => [...prev, response]);
            setUploadingDocs(prev => {
                const updated = { ...prev };
                delete updated[uploadKey];
                return updated;
            });

            alert(`✅ ${personName} - ${docType.replace(/_/g, ' ')} uploaded successfully to S3!`);
            fetchUserDocuments(userId);
        } catch (error: any) {
            const errorMsg = error.message || 'Upload failed';
            setUploadErrors(prev => ({ ...prev, [uploadKey]: errorMsg }));
            console.error('S3 upload error:', error);
            alert(`❌ Upload failed: ${errorMsg}`);
        }
    };

    const handleDeleteBlog = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this editorial piece? This action cannot be undone.")) return;
        try {
            await adminApi.deleteBlog(id);
            alert("Editorial content deleted successfully.");
            loadData();
        } catch (e: any) {
            alert("Failed to delete: " + e.message);
        }
    };

    const handleToggleBlogStatus = async (item: any) => {
        try {
            await adminApi.bulkUpdateBlogStatus([item.id || item._id], !item.isPublished);
            alert(`Content ${!item.isPublished ? 'published live' : 'moved to drafts'}.`);
            loadData();
        } catch (e: any) {
            alert("Failed to update status: " + e.message);
        }
    };

    const handleDeleteCommunityPost = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this community broadcast?")) return;
        try {
            await adminApi.deleteForumPost(id);
            alert("Community post removed.");
            loadData();
        } catch (e: any) {
            alert("Failed to delete: " + e.message);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm("CRITICAL: Delete this user account? All profile data and records will be purged. This action is irreversible.")) return;
        try {
            await adminApi.deleteUser(id);
            alert("User account has been permanently removed.");
            loadData();
        } catch (e: any) {
            alert("Operation failed: " + e.message);
        }
    };

    const handleDeleteApplication = async (id: string) => {
        if (!window.confirm("Are you sure you want to purge this loan application record?")) return;
        try {
            await adminApi.deleteApplication(id);
            alert("Application record removed.");
            loadData();
        } catch (e: any) {
            alert("Failed to remove record: " + e.message);
        }
    };

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        if (activeSection === 'blogs') {
            return (item.title?.toLowerCase().includes(query) ||
                item.authorName?.toLowerCase().includes(query));
        }
        if (activeSection === 'applications') {
            const fName = (item.firstName || item.student?.firstName || '').toLowerCase();
            const lName = (item.lastName || item.student?.lastName || '').toLowerCase();
            const appNum = (item.applicationNumber || '').toLowerCase();
            const bName = (item.bank || item.targetBank || '').toLowerCase();
            const email = (item.email || item.student?.email || '').toLowerCase();
            return (appNum.includes(query) || fName.includes(query) || lName.includes(query) || bName.includes(query) || email.includes(query));
        }
        if (activeSection === 'users') {
            const fName = (item.firstName || '').toLowerCase();
            const lName = (item.lastName || '').toLowerCase();
            const email = (item.email || '').toLowerCase();
            const roleMatch = userRoleFilter === 'all' ||
                (userRoleFilter === 'student' && (item.role === 'user' || item.role === 'student')) ||
                (userRoleFilter === 'bank' && item.role === 'bank') ||
                (userRoleFilter === 'staff' && (item.role === 'staff' || item.role === 'staff_admin')) ||
                (userRoleFilter === 'admin' && item.role?.includes('admin'));

            return roleMatch && (fName.includes(query) || lName.includes(query) || email.includes(query));
        }
        return true;
    }).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.created_at || a.updatedAt || a.submittedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || b.updatedAt || b.submittedAt || 0).getTime();
        return dateB - dateA;
    });

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-red-100 text-red-600 border-red-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
        cancelled: "bg-gray-100 text-gray-600 border-gray-200",
        draft: "bg-gray-100 text-gray-500 border-gray-200",
    };

    const pendingCount = Number(stats.apps?.statusStats?.pending || 0) + Number(stats.apps?.statusStats?.processing || 0) + Number(stats.apps?.statusStats?.submitted || 0);
    const approvedCount = Number(stats.apps?.statusStats?.approved || 0) + Number(stats.apps?.statusStats?.disbursed || 0);
    const rejectedCount = Number(stats.apps?.statusStats?.rejected || 0) + Number(stats.apps?.statusStats?.cancelled || 0);
    const totalApps = Number(stats.apps?.total ?? 0);
    const approvalRate = totalApps > 0 ? Math.round((approvedCount / totalApps) * 100) : 0;

    const sectionTitles: Record<string, string> = {
        overview: 'Dashboard',
        applicants: 'Pull & Share Documents',
        applications: 'Active Pipeline',
        tasks: 'Action Items',
        performance: 'Performance',
        users: 'User Directory',
        blogs: 'Editorial Content',
        community: 'Engagement Hub',
        communications: 'Outreach Center',
        my_profile: 'My Profile',
        chat_customer: 'Support Chat',
        onboarding: 'Applicant Onboarding',
    };

    const navItems = [
        { section: "overview", icon: "dashboard", label: "Dashboard", badge: 0 },
        { section: "applicants", icon: "send_to_mobile", label: "Document Transfer", badge: 0 },
        { section: "applications", icon: "description", label: "Active Pipeline", badge: pendingCount },
        { section: "tasks", icon: "check_circle", label: "Action Items", badge: tasks.filter(t => !t.completed).length },
        { section: "performance", icon: "insights", label: "Performance", badge: 0 },
        { section: "users", icon: "people", label: "User Directory", badge: 0 },
        { section: "blogs", icon: "article", label: "Editorial Content", badge: 0 },
        { section: "community", icon: "groups", label: "Engagement Hub", badge: 0 },
        { section: "communications", icon: "mail", label: "Outreach Center", badge: 0 },
        { section: "chat_customer", icon: "support_agent", label: "Support Chat", badge: 0 },
        { section: "my_profile", icon: "badge", label: "My Profile", badge: 0 },
    ];

    return (
        <div className="h-screen overflow-hidden flex bg-white text-slate-900 font-sans text-sm">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar — slim icon rail, expands to 220px on hover */}
            <aside className={`group/sidebar fixed inset-y-0 left-0 z-50 bg-[#0f172a] flex flex-col py-3 gap-1
                shadow-xl border-r border-slate-800/60
                transition-[width] duration-200 ease-in-out overflow-hidden
                w-[56px] hover:w-[220px]
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

                {/* Logo */}
                {/* Logo Area */}
                <div className="flex flex-col items-center gap-1.5 px-2 mb-6 mt-2 flex-shrink-0">
                    <img
                        src="/images/vidhyaloans-logo-transparent.png"
                        alt="VidyaLoans"
                        className="w-10 h-10 object-contain drop-shadow-md"
                    />
                    <span className="text-[25px] font-bold text-white whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 tracking-tight">
                        VidyaLoans
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 flex flex-col w-full gap-0.5 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
                    {navItems.map(item => (
                        <NavItem key={item.section} {...item} active={activeSection} onClick={(s: string) => {
                            if (s === 'chat_customer') setAutoStartUser(null);
                            setActiveSection(s);
                            setSidebarOpen(false);
                        }} />
                    ))}
                </nav>

                {/* Avatar + Sign-out at bottom */}
                <div className="px-3 mt-2 flex-shrink-0">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer group/profile border border-transparent hover:border-slate-700/50">
                        <div onClick={() => { setActiveSection('my_profile'); setSidebarOpen(false); }} className="flex items-center gap-3 flex-1 min-w-0" title="View Profile">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full border border-slate-700 object-cover flex-shrink-0 group-hover/profile:border-indigo-500 transition-colors"
                            />
                            <div className="min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                                <p className="text-[13px] font-['Playfair_Display',serif] tracking-wide text-slate-200 truncate leading-tight">{user?.firstName || 'Staff Profile'}</p>
                                <p className="text-[10px] text-slate-500 capitalize truncate mt-0.5">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-500 hover:text-rose-400 p-1.5 flex-shrink-0 opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 rounded-md hover:bg-rose-500/10" title="Sign Out">
                            <span className="material-symbols-outlined text-[16px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-[56px] bg-[#f8fafc]">
                {/* Header */}
                <header className="h-[56px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">
                    {/* Left: Breadcrumb + Title */}
                    <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">VIdyaLoans</p>
                        <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">
                            {sectionTitles[activeSection] || activeSection}
                        </h1>
                    </div>

                    {/* Center: Search */}
                    <div className="relative hidden md:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search applications, students, IDs..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 w-72 transition-all text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Right: Bell + User + Logout */}
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <span className="material-symbols-outlined text-[20px]">menu</span>
                        </button>
                        <button className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            {pendingCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />}
                        </button>
                        <div className="h-5 w-px bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                alt="Avatar"
                                className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 object-cover"
                            />
                            <div className="hidden sm:flex flex-col">
                                <span className="text-[12px] font-semibold text-slate-800 leading-none">{user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName[0] + '.' : ''}` : 'Staff'}</span>
                                <span className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">{user?.role?.replace('_', ' ') || 'Staff'}</span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto custom-scrollbar ${(activeSection.startsWith('chat_') || activeSection === 'onboarding') ? 'p-0' : 'p-6 space-y-5'} bg-[#f8fafc]`}>
                    {activeSection === "chat_customer" && <ChatInterface role="staff" initialUser={autoStartUser} />}


                    {/* Onboarding Flow View */}
                    {activeSection === "onboarding" && (
                        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
                            {/* Header / Breadcrumbs & Stepper */}
                            <div className="bg-white border-b border-slate-200 shrink-0">
                                <div className="px-8 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-emerald-600 font-bold cursor-pointer hover:underline" onClick={resetOnboardModal}>Students</span>
                                        <span className="text-slate-400 material-symbols-outlined text-[16px]">chevron_right</span>
                                        <span className="text-slate-900 font-bold">
                                            {onboardStep === 1 ? 'New Applicant Onboarding' : `${newStudent.firstName} ${newStudent.lastName}`}
                                        </span>
                                    </div>
                                    <button onClick={resetOnboardModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>

                                {onboardStep >= 2 && (
                                    <div className="px-8 py-5 flex items-center gap-8">
                                        {/* Profile summary card */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-4 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm min-w-[280px]">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
                                                    {newStudent.firstName?.[0] || ''}{newStudent.lastName?.[0] || ''}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 truncate">{newStudent.firstName} {newStudent.lastName}</div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium"><span className="material-symbols-outlined text-[14px]">mail</span> {newStudent.email}</div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium"><span className="material-symbols-outlined text-[14px]">call</span> {newStudent.mobile}</div>
                                                </div>
                                            </div>
                                            <button className="flex flex-col items-center justify-center p-3.5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:bg-slate-50 transition-colors shrink-0 px-6">
                                                <span className="material-symbols-outlined text-[20px] text-indigo-500 mb-1">share</span>
                                                <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">Student<br />Platform Link</span>
                                            </button>
                                        </div>

                                        {/* Progress Stepper */}
                                        <div className="flex-1 flex items-center justify-center gap-12 pl-12 border-l border-slate-200">
                                            <div className="flex flex-col items-center gap-2 relative cursor-pointer group" onClick={() => setOnboardStep(2)}>
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-md transition-all ${onboardStep >= 2 ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                                                    {onboardStep > 2 ? <span className="material-symbols-outlined text-[18px]">check</span> : '1'}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${onboardStep >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>Profile</div>
                                                <div className={`absolute top-4.5 left-9 w-28 h-[2px] -z-0 ${onboardStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 relative cursor-pointer group" onClick={() => { if (onboardStep >= 2) setOnboardStep(3) }}>
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-md transition-all ${onboardStep >= 3 ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                                                    {onboardStep > 3 ? <span className="material-symbols-outlined text-[18px]">check</span> : '2'}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${onboardStep >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>Documents</div>
                                                <div className={`absolute top-4.5 left-9 w-28 h-[2px] -z-0 ${onboardStep >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 relative group">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-md transition-all ${onboardStep >= 4 ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>3</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${onboardStep >= 4 ? 'text-emerald-700' : 'text-slate-400'}`}>Applications</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {onboardStep === 2 && (
                                    <div className="px-8 flex items-center gap-10 border-t border-slate-100 bg-slate-50/30 overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 'personal', label: 'Personal Information', status: 'Incomplete', color: 'text-rose-500', icon: 'person' },
                                            { id: 'academic', label: 'Academic Qualifications', status: 'Incomplete', color: 'text-rose-500', icon: 'school' },
                                            { id: 'work', label: 'Work Experience', status: 'Optional', color: 'text-amber-500', icon: 'work' },
                                            { id: 'tests', label: 'Tests', status: 'Incomplete', color: 'text-rose-500', icon: 'terminal' },
                                            { id: 'family', label: 'Family & Co-applicant', status: 'Incomplete', color: 'text-rose-500', icon: 'family_restroom' },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setProfileTab(tab.id as any)}
                                                className={`py-4 flex items-center gap-2 border-b-2 transition-all shrink-0 ${profileTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${profileTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`}>{tab.icon}</span>
                                                <div className="text-left">
                                                    <div className="text-[11px] font-bold uppercase tracking-tight leading-none mb-0.5">{tab.label}</div>
                                                    <div className={`text-[9px] font-bold ${profileTab === tab.id ? 'text-emerald-500' : tab.color}`}>{tab.status}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-8 relative">
                                {onboardStep === 1 ? (
                                    /* STEP 1: Quick Register or Link Existing */
                                    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl shadow-emerald-900/5 border border-slate-200 p-10 mt-12 animate-in slide-in-from-bottom-8 duration-500">
                                        <div className="text-center mb-8">
                                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner transform -rotate-3 transition-all ${onboardMode === 'new' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600 rotate-3'}`}>
                                                <span className="material-symbols-outlined text-[40px]">{onboardMode === 'new' ? 'person_add' : 'link'}</span>
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{onboardMode === 'new' ? 'Register New Applicant' : 'Link Existing Student'}</h2>
                                            <p className="text-slate-500 mt-2 text-sm font-medium">{onboardMode === 'new' ? 'Create a student account to initiate the application process.' : 'Onboard an existing student to upload their documents.'}</p>
                                        </div>

                                        <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl mb-10 max-w-sm mx-auto">
                                            <button
                                                onClick={() => setOnboardMode('new')}
                                                className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${onboardMode === 'new' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Register New
                                            </button>
                                            <button
                                                onClick={() => setOnboardMode('link')}
                                                className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${onboardMode === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Link Existing
                                            </button>
                                        </div>

                                        {onboardMode === 'new' ? (
                                            <form id="quick-register-form" onSubmit={handleQuickRegister} className="space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name*</label>
                                                        <input required type="text" value={quickForm.firstName} onChange={e => setQuickForm({ ...quickForm, firstName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="e.g. Rahul" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Last Name*</label>
                                                        <input required type="text" value={quickForm.lastName} onChange={e => setQuickForm({ ...quickForm, lastName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="e.g. Sharma" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address*</label>
                                                    <input required type="email" value={quickForm.email} onChange={e => setQuickForm({ ...quickForm, email: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="rahul@example.com" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mobile Number*</label>
                                                    <div className="flex gap-3">
                                                        <div className="px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-[13px] flex items-center gap-2 font-bold text-slate-600">🇮🇳 +91</div>
                                                        <input required type="tel" value={quickForm.phone} onChange={e => setQuickForm({ ...quickForm, phone: formatPhone(e.target.value) })} className={`flex-1 px-5 py-3.5 bg-slate-50 border ${quickForm.phone && !isPhoneValid(quickForm.phone) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold placeholder:text-slate-300`} placeholder="9876543210" maxLength={10} />
                                                    </div>
                                                </div>
                                            </form>
                                        ) : (
                                            <form id="link-existing-form" onSubmit={handleCheckEmailAndLink} className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Student Email Address</label>
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                                        <input
                                                            required
                                                            type="email"
                                                            value={userSearchQuery}
                                                            onChange={e => setUserSearchQuery(e.target.value)}
                                                            placeholder="Enter existing student's email..."
                                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                                        />
                                                        {isSearchingSuggestions && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {userSuggestions.length > 0 && (
                                                        <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                                            <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Matching Accounts</div>
                                                            {userSuggestions.map((user) => (
                                                                <button
                                                                    key={user.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setUserSearchQuery(user.email);
                                                                        handleLinkExistingUser(user);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors text-left group"
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[12px] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-[13px] font-bold text-slate-900 truncate">{user.firstName} {user.lastName}</div>
                                                                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                                                                    </div>
                                                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-indigo-600 text-[18px]">add_circle</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-indigo-500 text-[20px] mt-0.5">info</span>
                                                    <p className="text-[12px] text-indigo-700 font-medium leading-relaxed">
                                                        The system will verify if this student is already registered. If found, you'll be able to proceed with their dossier update.
                                                    </p>
                                                </div>
                                            </form>
                                        )}

                                    </div>
                                ) : onboardStep === 2 ? (
                                    /* STEP 2: Full Profile */
                                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">

                                        {/* Auto-fill banner */}
                                        <div className="mb-8 flex items-center justify-between p-4 bg-white border border-indigo-200 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                                                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-black text-slate-800">Autofill student details</h4>
                                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Fill student profile in just few minutes.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-[12px] font-black text-slate-600">14 Student Autofills left</span>
                                                <button type="button" onClick={() => setOnboardStep(3)} className="px-5 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-[11px] font-black flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-sm">
                                                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                                    Upload Documents
                                                </button>
                                            </div>
                                        </div>

                                        {profileTab === 'personal' && (
                                            <form id="profile-personal-form" onSubmit={handleSaveProfile} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">person</span>
                                                        Personal Information
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">First Name*</label>
                                                            <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Middle Name</label>
                                                            <input type="text" value={newStudent.middleName} onChange={e => setNewStudent({ ...newStudent, middleName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Middle Name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Last Name*</label>
                                                            <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Address*</label>
                                                            <input required type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                            <div className="flex gap-2">
                                                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                                <input required type="tel" value={newStudent.mobile} onChange={e => setNewStudent({ ...newStudent, mobile: formatPhone(e.target.value) })} className={`flex-1 px-4 py-3 bg-slate-50 border ${newStudent.mobile && !isPhoneValid(newStudent.mobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} maxLength={10} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Date of Birth*</label>
                                                            <input required type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Gender*</label>
                                                            <select required value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none text-slate-600">
                                                                <option value="">Select Gender</option>
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                                <option value="other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Marital Status*</label>
                                                            <select required value={newStudent.maritalStatus} onChange={e => setNewStudent({ ...newStudent, maritalStatus: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none text-slate-600">
                                                                <option value="">Select Marital Status</option>
                                                                <option value="single">Single</option>
                                                                <option value="married">Married</option>
                                                                <option value="divorced">Divorced</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100 my-8"></div>

                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">location_on</span>
                                                        Mailing Address
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                            <input type="text" value={newStudent.mailingAddress.address1} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address1: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                            <input type="text" value={newStudent.mailingAddress.address2} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address2: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                            <select value={newStudent.mailingAddress.country} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, country: e.target.value, state: "" } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                <option value="">Select Country</option>
                                                                {getAllCountries().map(country => (
                                                                    <option key={country} value={country}>{country}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                            <select value={newStudent.mailingAddress.state} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, state: e.target.value } })} disabled={!newStudent.mailingAddress.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <option value="">Select State</option>
                                                                {newStudent.mailingAddress.country && getStatesByCountry(newStudent.mailingAddress.country).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                            <input type="text" value={newStudent.mailingAddress.city} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, city: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                            <input type="text" value={newStudent.mailingAddress.pincode} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, pincode: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Pincode" />
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100 my-8"></div>

                                                <section>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">location_on</span>
                                                            Permanent Address
                                                        </div>
                                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.mailingAddress } });
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                                            />
                                                            Same as mailing address
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                            <input type="text" value={newStudent.permanentAddress.address1} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, address1: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                            <input type="text" value={newStudent.permanentAddress.address2} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, address2: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                            <select value={newStudent.permanentAddress.country} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, country: e.target.value, state: "" } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                <option value="">Select Country</option>
                                                                {getAllCountries().map(country => (
                                                                    <option key={country} value={country}>{country}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                            <select value={newStudent.permanentAddress.state} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, state: e.target.value } })} disabled={!newStudent.permanentAddress.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <option value="">Select State</option>
                                                                {newStudent.permanentAddress.country && getStatesByCountry(newStudent.permanentAddress.country).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                            <input type="text" value={newStudent.permanentAddress.city} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, city: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                            <input type="text" value={newStudent.permanentAddress.pincode} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, pincode: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Pincode" />
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100 my-8"></div>

                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">badge</span>
                                                        Passport Information
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Passport Number*</label>
                                                            <input type="text" value={newStudent.passport.number} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, number: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Number" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Date*</label>
                                                            <input type="date" value={newStudent.passport.issueDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueDate: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Expiry Date*</label>
                                                            <input type="date" value={newStudent.passport.expiryDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, expiryDate: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Country*</label>
                                                            <select value={newStudent.passport.issueCountry} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueCountry: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Issue Country</option><option value="India">India</option></select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Birth*</label>
                                                            <input type="text" value={newStudent.passport.birthCity} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCity: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Birth*</label>
                                                            <select value={newStudent.passport.birthCountry} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCountry: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Country of Birth</option><option value="India">India</option></select>
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100 my-8"></div>

                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">public</span>
                                                        Nationality
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nationality*</label>
                                                            <select value={newStudent.nationality.name} onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, name: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Nationality</option><option value="Indian">Indian</option><option value="American">American</option></select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Citizenship*</label>
                                                            <select value={newStudent.nationality.citizenship} onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, citizenship: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Citizenship</option><option value="India">India</option><option value="USA">USA</option></select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Is the applicant a citizen of more than one country?*</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="dualCitizen" checked={newStudent.nationality.dualCitizenship === 'No'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, dualCitizenship: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="dualCitizen" checked={newStudent.nationality.dualCitizenship === 'Yes'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, dualCitizenship: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={newStudent.nationality.dualCitizenship === 'Yes' ? newStudent.nationality.name : ""}
                                                                disabled={newStudent.nationality.dualCitizenship === 'No'}
                                                                onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, name: e.target.value } })}
                                                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.nationality.dualCitizenship === 'No' ? 'opacity-50 grayscale' : ''}`}
                                                                placeholder="Enter Nationality"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Is the applicant living and studying in any other country?*</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="livingOther" checked={newStudent.nationality.livingOtherCountry === 'No'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, livingOtherCountry: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="livingOther" checked={newStudent.nationality.livingOtherCountry === 'Yes'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, livingOtherCountry: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <select
                                                                value={newStudent.nationality.livingOtherCountryName}
                                                                disabled={newStudent.nationality.livingOtherCountry === 'No'}
                                                                onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, livingOtherCountryName: e.target.value } })}
                                                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.nationality.livingOtherCountry === 'No' ? 'opacity-50 grayscale' : ''}`}
                                                            >
                                                                <option value="">Select Living Country</option>
                                                                <option value="USA">USA</option>
                                                                <option value="UK">UK</option>
                                                                <option value="Canada">Canada</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100 my-8"></div>

                                                {/* <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">info</span>
                                                        Background Info
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant applied for any type of immigration into any country?</label>
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgImmigration" checked={newStudent.background.immigrationApplied === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationApplied: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                    </label>
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgImmigration" checked={newStudent.background.immigrationApplied === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationApplied: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div><select value={newStudent.background.immigrationAppliedCountry} disabled={newStudent.background.immigrationApplied === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationAppliedCountry: e.target.value } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.immigrationApplied === 'No' ? 'opacity-50 grayscale' : ''}`}><option value="">Select Country</option><option value="USA">USA</option><option value="Canada">Canada</option></select></div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-700 mb-2 block">Does applicant suffer from a serious medical condition?</label>
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgMedical" checked={newStudent.background.medicalCondition === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalCondition: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                    </label>
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgMedical" checked={newStudent.background.medicalCondition === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalCondition: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div><input type="text" value={newStudent.background.medicalConditionDetails} disabled={newStudent.background.medicalCondition === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalConditionDetails: e.target.value } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.medicalCondition === 'No' ? 'opacity-50 grayscale' : ''}`} placeholder="Specify Here..." /></div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant Visa refusal for any country?</label>
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgVisa" checked={newStudent.background.visaRefusal === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusal: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                    </label>
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgVisa" checked={newStudent.background.visaRefusal === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusal: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <select value={newStudent.background.visaRefusalDetails.split('|')[0] || ""} disabled={newStudent.background.visaRefusal === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusalDetails: `${e.target.value}|${newStudent.background.visaRefusalDetails.split('|')[1] || ""}` } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.visaRefusal === 'No' ? 'opacity-50 grayscale' : ''}`}><option value="">Select Country</option><option value="USA">USA</option><option value="UK">UK</option></select>
                                                                <input type="text" value={newStudent.background.visaRefusalDetails.split('|')[1] || ""} disabled={newStudent.background.visaRefusal === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusalDetails: `${newStudent.background.visaRefusalDetails.split('|')[0] || ""}|${e.target.value}` } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.visaRefusal === 'No' ? 'opacity-50 grayscale' : ''}`} placeholder="Type of Visa" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant ever been convicted of a criminal offence?</label>
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgCrime" checked={newStudent.background.criminalOffence === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, criminalOffence: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                    </label>
                                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                        <input type="radio" name="bgCrime" checked={newStudent.background.criminalOffence === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, criminalOffence: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div><input type="text" value={newStudent.background.criminalOffenceDetails} disabled={newStudent.background.criminalOffence === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, criminalOffenceDetails: e.target.value } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.criminalOffence === 'No' ? 'opacity-50 grayscale' : ''}`} placeholder="Specify Here..." /></div>
                                                        </div>
                                                    </div>
                                                </section> */}

                                                <div className="h-px bg-slate-100 my-8"></div>

                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">contact_emergency</span>
                                                        Important Contacts
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="text-[12px] font-black text-slate-900 block">Emergency Contacts</label>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name*</label>
                                                            <input type="text" value={newStudent.emergencyContact.name} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, name: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Phone*</label>
                                                            <div className="flex gap-2">
                                                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                                <input type="tel" value={newStudent.emergencyContact.phone} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, phone: formatPhone(e.target.value) } })} className={`flex-1 px-4 py-3 bg-slate-50 border ${newStudent.emergencyContact.phone && !isPhoneValid(newStudent.emergencyContact.phone) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email*</label>
                                                            <input type="email" value={newStudent.emergencyContact.email} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, email: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Email Address" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Relation with Applicant*</label>
                                                            <input type="text" value={newStudent.emergencyContact.relation} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, relation: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Relation" />
                                                        </div>
                                                    </div>
                                                </section>
                                            </form>
                                        )}

                                        {profileTab === 'family' && (
                                            <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                                {/* Father Details */}
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">person</span>
                                                        Father's Details
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Father's Name*</label>
                                                            <input type="text" value={newStudent.family.fatherName} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherName: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                            <input type="tel" value={newStudent.family.fatherMobile} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherMobile: formatPhone(e.target.value) } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.fatherMobile && !isPhoneValid(newStudent.family.fatherMobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email ID</label>
                                                            <input type="email" value={newStudent.family.fatherEmail} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherEmail: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Email Address" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Occupation</label>
                                                            <input type="text" value={newStudent.family.fatherOccupation} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherOccupation: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Occupation" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Father's Aadhar Number</label>
                                                            <input type="text" value={newStudent.family.fatherAadhar} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherAadhar: formatAadhar(e.target.value) } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.fatherAadhar && !isAadharValid(newStudent.family.fatherAadhar) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="12 Digit Aadhar" maxLength={12} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Father's PAN Card</label>
                                                            <input type="text" value={newStudent.family.fatherPan} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherPan: formatPan(e.target.value) } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.fatherPan && !isPanValid(newStudent.family.fatherPan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100"></div>

                                                {/* Mother Details */}
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">person</span>
                                                        Mother's Details
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mother's Name*</label>
                                                            <input type="text" value={newStudent.family.motherName} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherName: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                            <input type="tel" value={newStudent.family.motherMobile} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherMobile: formatPhone(e.target.value) } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.motherMobile && !isPhoneValid(newStudent.family.motherMobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email ID</label>
                                                            <input type="email" value={newStudent.family.motherEmail} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherEmail: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Email Address" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Occupation</label>
                                                            <input type="text" value={newStudent.family.motherOccupation} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherOccupation: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Occupation" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mother's Aadhar Number</label>
                                                            <input type="text" value={newStudent.family.motherAadhar} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherAadhar: formatAadhar(e.target.value) } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.motherAadhar && !isAadharValid(newStudent.family.motherAadhar) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="12 Digit Aadhar" maxLength={12} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mother's PAN Card</label>
                                                            <input type="text" value={newStudent.family.motherPan} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherPan: formatPan(e.target.value) } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.motherPan && !isPanValid(newStudent.family.motherPan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100"></div>

                                                {/* Co-applicant Details */}
                                                <section>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">group</span>
                                                            Co-applicant Details
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-emerald-600 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={newStudent.coApplicant.isSameAsFather}
                                                                    onChange={e => {
                                                                        const checked = e.target.checked;
                                                                        setNewStudent({
                                                                            ...newStudent,
                                                                            coApplicant: {
                                                                                ...newStudent.coApplicant,
                                                                                isSameAsFather: checked,
                                                                                isSameAsMother: false,
                                                                                name: checked ? newStudent.family.fatherName : "",
                                                                                mobile: checked ? newStudent.family.fatherMobile : "",
                                                                                email: checked ? newStudent.family.fatherEmail : "",
                                                                                occupation: checked ? newStudent.family.fatherOccupation : "",
                                                                                aadhar: checked ? newStudent.family.fatherAadhar : "",
                                                                                pan: checked ? newStudent.family.fatherPan : "",
                                                                                employmentType: checked ? newStudent.family.fatherEmploymentType : "",
                                                                                monthlyIncome: checked ? newStudent.family.fatherMonthlyIncome : "",
                                                                                relation: checked ? "Father" : ""
                                                                            }
                                                                        })
                                                                    }}
                                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                                Same as Father
                                                            </label>
                                                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-emerald-600 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={newStudent.coApplicant.isSameAsMother}
                                                                    onChange={e => {
                                                                        const checked = e.target.checked;
                                                                        setNewStudent({
                                                                            ...newStudent,
                                                                            coApplicant: {
                                                                                ...newStudent.coApplicant,
                                                                                isSameAsMother: checked,
                                                                                isSameAsFather: false,
                                                                                name: checked ? newStudent.family.motherName : "",
                                                                                mobile: checked ? newStudent.family.motherMobile : "",
                                                                                email: checked ? newStudent.family.motherEmail : "",
                                                                                occupation: checked ? newStudent.family.motherOccupation : "",
                                                                                aadhar: checked ? newStudent.family.motherAadhar : "",
                                                                                pan: checked ? newStudent.family.motherPan : "",
                                                                                employmentType: checked ? newStudent.family.motherEmploymentType : "",
                                                                                monthlyIncome: checked ? newStudent.family.motherMonthlyIncome : "",
                                                                                relation: checked ? "Mother" : ""
                                                                            }
                                                                        })
                                                                    }}
                                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                                Same as Mother
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Co-applicant Name*</label>
                                                            <input type="text" value={newStudent.coApplicant.name} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, name: e.target.value, isSameAsFather: false, isSameAsMother: false } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                            <input type="tel" value={newStudent.coApplicant.mobile} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, mobile: formatPhone(e.target.value), isSameAsFather: false, isSameAsMother: false } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.coApplicant.mobile && !isPhoneValid(newStudent.coApplicant.mobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email ID</label>
                                                            <input type="email" value={newStudent.coApplicant.email} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, email: e.target.value, isSameAsFather: false, isSameAsMother: false } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Email Address" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Relation with Applicant*</label>
                                                            <input type="text" value={newStudent.coApplicant.relation} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, relation: e.target.value, isSameAsFather: false, isSameAsMother: false } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Relation" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Occupation</label>
                                                            <input type="text" value={newStudent.coApplicant.occupation} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, occupation: e.target.value, isSameAsFather: false, isSameAsMother: false } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Occupation" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Aadhar Number</label>
                                                            <input type="text" value={newStudent.coApplicant.aadhar} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, aadhar: formatAadhar(e.target.value), isSameAsFather: false, isSameAsMother: false } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.coApplicant.aadhar && !isAadharValid(newStudent.coApplicant.aadhar) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="12 Digit Aadhar" maxLength={12} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">PAN Card</label>
                                                            <input type="text" value={newStudent.coApplicant.pan} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, pan: formatPan(e.target.value), isSameAsFather: false, isSameAsMother: false } })} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.coApplicant.pan && !isPanValid(newStudent.coApplicant.pan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
                                                        </div>
                                                    </div>
                                                </section>

                                                <div className="h-px bg-slate-100"></div>

                                                {/* Employment & Financial Details */}
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">work</span>
                                                        Employment & Income Details
                                                    </div>

                                                    {/* Father's Employment */}
                                                    <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
                                                        <h4 className="font-bold text-slate-700 mb-4">Father's Employment</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employment Type*</label>
                                                                <select value={newStudent.family.fatherEmploymentType} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherEmploymentType: e.target.value } })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Employment Type</option>
                                                                    <option value="employed">Employed (Salaried)</option>
                                                                    <option value="self_employed_business">Self-Employed (Business)</option>
                                                                    <option value="self_employed_professional">Self-Employed (Professional)</option>
                                                                    <option value="retired">Retired</option>
                                                                    <option value="not_employed">Not Employed</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monthly Income (₹)</label>
                                                                <input type="number" value={newStudent.family.fatherMonthlyIncome} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherMonthlyIncome: e.target.value } })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Monthly Income" />
                                                            </div>
                                                        </div>
                                                        {/* Father's Document Requirements */}
                                                        {newStudent.family.fatherEmploymentType && (
                                                            <div className="mt-6 bg-white p-4 rounded-lg border border-emerald-200">
                                                                <p className="text-xs font-bold text-emerald-600 mb-3">📋 Required Documents for Father:</p>
                                                                {newStudent.family.fatherEmploymentType === 'employed' && (
                                                                    <ul className="text-xs text-slate-600 space-y-2">
                                                                        <li>✓ Last 3 months salary slips</li>
                                                                        <li>✓ Last 6 months bank statements</li>
                                                                    </ul>
                                                                )}
                                                                {(newStudent.family.fatherEmploymentType === 'self_employed_business' || newStudent.family.fatherEmploymentType === 'self_employed_professional') && (
                                                                    <ul className="text-xs text-slate-600 space-y-2">
                                                                        <li>✓ Business Registration/License</li>
                                                                        <li>✓ Labour License (if applicable)</li>
                                                                        <li>✓ Udyam Certificate (if registered)</li>
                                                                        <li>✓ Last 6 months bank statements</li>
                                                                        <li>✓ Last 2 years ITR (Income Tax Returns)</li>
                                                                        <li>✓ Balance Sheet & Profit/Loss Statement (if available)</li>
                                                                    </ul>
                                                                )}
                                                                {newStudent.family.fatherEmploymentType === 'retired' && (
                                                                    <ul className="text-xs text-slate-600 space-y-2">
                                                                        <li>✓ Retirement certificate/pension document</li>
                                                                        <li>✓ Last 6 months bank statements</li>
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Mother's Employment */}
                                                    <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
                                                        <h4 className="font-bold text-slate-700 mb-4">Mother's Employment</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employment Type*</label>
                                                                <select value={newStudent.family.motherEmploymentType} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherEmploymentType: e.target.value } })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Employment Type</option>
                                                                    <option value="employed">Employed (Salaried)</option>
                                                                    <option value="self_employed_business">Self-Employed (Business)</option>
                                                                    <option value="self_employed_professional">Self-Employed (Professional)</option>
                                                                    <option value="retired">Retired</option>
                                                                    <option value="not_employed">Not Employed</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monthly Income (₹)</label>
                                                                <input type="number" value={newStudent.family.motherMonthlyIncome} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherMonthlyIncome: e.target.value } })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Monthly Income" />
                                                            </div>
                                                        </div>
                                                        {/* Mother's Document Requirements */}
                                                        {newStudent.family.motherEmploymentType && (
                                                            <div className="mt-6 bg-white p-4 rounded-lg border border-emerald-200">
                                                                <p className="text-xs font-bold text-emerald-600 mb-3">📋 Required Documents for Mother:</p>
                                                                {newStudent.family.motherEmploymentType === 'employed' && (
                                                                    <ul className="text-xs text-slate-600 space-y-2">
                                                                        <li>✓ Last 3 months salary slips</li>
                                                                        <li>✓ Last 6 months bank statements</li>
                                                                    </ul>
                                                                )}
                                                                {(newStudent.family.motherEmploymentType === 'self_employed_business' || newStudent.family.motherEmploymentType === 'self_employed_professional') && (
                                                                    <ul className="text-xs text-slate-600 space-y-2">
                                                                        <li>✓ Business Registration/License</li>
                                                                        <li>✓ Labour License (if applicable)</li>
                                                                        <li>✓ Udyam Certificate (if registered)</li>
                                                                        <li>✓ Last 6 months bank statements</li>
                                                                        <li>✓ Last 2 years ITR (Income Tax Returns)</li>
                                                                        <li>✓ Balance Sheet & Profit/Loss Statement (if available)</li>
                                                                    </ul>
                                                                )}
                                                                {newStudent.family.motherEmploymentType === 'retired' && (
                                                                    <ul className="text-xs text-slate-600 space-y-2">
                                                                        <li>✓ Retirement certificate/pension document</li>
                                                                        <li>✓ Last 6 months bank statements</li>
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Co-Applicant's Employment */}
                                                    {newStudent.coApplicant.name && (
                                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                            <h4 className="font-bold text-slate-700 mb-4">Co-Applicant's Employment</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employment Type*</label>
                                                                    <select value={newStudent.coApplicant.employmentType} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, employmentType: e.target.value, isSameAsFather: false, isSameAsMother: false } })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Employment Type</option>
                                                                        <option value="employed">Employed (Salaried)</option>
                                                                        <option value="self_employed_business">Self-Employed (Business)</option>
                                                                        <option value="self_employed_professional">Self-Employed (Professional)</option>
                                                                        <option value="retired">Retired</option>
                                                                        <option value="not_employed">Not Employed</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monthly Income (₹)</label>
                                                                    <input type="number" value={newStudent.coApplicant.monthlyIncome} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, monthlyIncome: e.target.value, isSameAsFather: false, isSameAsMother: false } })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Monthly Income" />
                                                                </div>
                                                            </div>
                                                            {/* Co-Applicant's Document Requirements */}
                                                            {newStudent.coApplicant.employmentType && (
                                                                <div className="mt-6 bg-white p-4 rounded-lg border border-emerald-200">
                                                                    <p className="text-xs font-bold text-emerald-600 mb-3">📋 Required Documents for Co-Applicant:</p>
                                                                    {newStudent.coApplicant.employmentType === 'employed' && (
                                                                        <ul className="text-xs text-slate-600 space-y-2">
                                                                            <li>✓ Last 3 months salary slips</li>
                                                                            <li>✓ Last 6 months bank statements</li>
                                                                        </ul>
                                                                    )}
                                                                    {(newStudent.coApplicant.employmentType === 'self_employed_business' || newStudent.coApplicant.employmentType === 'self_employed_professional') && (
                                                                        <ul className="text-xs text-slate-600 space-y-2">
                                                                            <li>✓ Business Registration/License</li>
                                                                            <li>✓ Labour License (if applicable)</li>
                                                                            <li>✓ Udyam Certificate (if registered)</li>
                                                                            <li>✓ Last 6 months bank statements</li>
                                                                            <li>✓ Last 2 years ITR (Income Tax Returns)</li>
                                                                            <li>✓ Balance Sheet & Profit/Loss Statement (if available)</li>
                                                                        </ul>
                                                                    )}
                                                                    {newStudent.coApplicant.employmentType === 'retired' && (
                                                                        <ul className="text-xs text-slate-600 space-y-2">
                                                                            <li>✓ Retirement certificate/pension document</li>
                                                                            <li>✓ Last 6 months bank statements</li>
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </section>
                                                <div className="mt-8 flex justify-end">
                                                    <button type="button" onClick={() => { alert('Family details saved.'); setOnboardStep(3); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Finalize & Upload Documents</button>
                                                </div>
                                            </div>
                                        )}

                                        {profileTab === 'academic' && (
                                            <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                        Education Summary
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Education*</label>
                                                            <select value={newStudent.academic.countryOfEducation} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, countryOfEducation: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Country</option><option value="India">India</option><option value="USA">USA</option><option value="UK">UK</option><option value="Canada">Canada</option></select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Highest Level of Education*</label>
                                                            <select value={newStudent.academic.highestLevel} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, highestLevel: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none">
                                                                <option value="">Select Level</option>
                                                                <option value="Postgraduate">Postgraduate</option>
                                                                <option value="Undergraduate">Undergraduate</option>
                                                                <option value="Grade 12">Grade 12 or equivalent</option>
                                                                <option value="Grade 10">Grade 10 or equivalent</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </section>

                                                {(newStudent.academic.highestLevel === 'Postgraduate') && (
                                                    <>
                                                        <div className="h-px bg-slate-100 my-8"></div>
                                                        <section>
                                                            <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                                <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">workspace_premium</span>
                                                                Post Graduate
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                    <select value={newStudent.academic.postgrad.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Country</option>
                                                                        {getAllCountries().map(country => (
                                                                            <option key={country} value={country}>{country}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                    <select value={newStudent.academic.postgrad.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, state: e.target.value } } })} disabled={!newStudent.academic.postgrad.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        <option value="">Select State</option>
                                                                        {newStudent.academic.postgrad.country && getStatesByCountry(newStudent.academic.postgrad.country).map(state => (
                                                                            <option key={state} value={state}>{state}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                    <select value={newStudent.academic.postgrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="Postgraduate">Postgraduate</option></select>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of University*</label>
                                                                    <input type="text" value={newStudent.academic.postgrad.university} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, university: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of University" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                    <input type="text" value={newStudent.academic.postgrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                    <input type="text" value={newStudent.academic.postgrad.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                    <select value={newStudent.academic.postgrad.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Percentage*</label>
                                                                    <input type="text" value={newStudent.academic.postgrad.percentage} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, percentage: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Percentage" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                    <input type="text" value={newStudent.academic.postgrad.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                    <input type="date" value={newStudent.academic.postgrad.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                    <input type="date" value={newStudent.academic.postgrad.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex justify-center md:justify-start">
                                                                <button type="button" onClick={() => alert('Postgraduate details saved to local state.')} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                            </div>
                                                        </section>
                                                    </>
                                                )}

                                                {(['Postgraduate', 'Undergraduate'].includes(newStudent.academic.highestLevel)) && (
                                                    <>
                                                        <div className="h-px bg-slate-100 my-8"></div>
                                                        <section>
                                                            <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                                <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">menu_book</span>
                                                                Undergraduate
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                    <select value={newStudent.academic.undergrad.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Country</option>
                                                                        {getAllCountries().map(country => (
                                                                            <option key={country} value={country}>{country}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                    <select value={newStudent.academic.undergrad.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, state: e.target.value } } })} disabled={!newStudent.academic.undergrad.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        <option value="">Select State</option>
                                                                        {newStudent.academic.undergrad.country && getStatesByCountry(newStudent.academic.undergrad.country).map(state => (
                                                                            <option key={state} value={state}>{state}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                    <select value={newStudent.academic.undergrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="Undergraduate">Undergraduate</option></select>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of University*</label>
                                                                    <input type="text" value={newStudent.academic.undergrad.university} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, university: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of University" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                    <input type="text" value={newStudent.academic.undergrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                    <input type="text" value={newStudent.academic.undergrad.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                    <select value={newStudent.academic.undergrad.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(UG)*</label>
                                                                    <input type="text" value={newStudent.academic.undergrad.score} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, score: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Score" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                    <input type="text" value={newStudent.academic.undergrad.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Backlogs</label>
                                                                    <input type="text" value={newStudent.academic.undergrad.backlogs} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, backlogs: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Backlogs" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                    <input type="date" value={newStudent.academic.undergrad.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                    <input type="date" value={newStudent.academic.undergrad.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex justify-center md:justify-start">
                                                                <button type="button" onClick={() => alert('Undergraduate details saved.')} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                            </div>
                                                        </section>
                                                    </>
                                                )}

                                                {(['Postgraduate', 'Undergraduate', 'Grade 12'].includes(newStudent.academic.highestLevel)) && (
                                                    <>
                                                        <div className="h-px bg-slate-100 my-8"></div>
                                                        <section>
                                                            <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                                <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                                Grade 12th or equivalent education
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                    <select value={newStudent.academic.grade12.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Country</option>
                                                                        {getAllCountries().map(country => (
                                                                            <option key={country} value={country}>{country}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                    <select value={newStudent.academic.grade12.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, state: e.target.value } } })} disabled={!newStudent.academic.grade12.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        <option value="">Select State</option>
                                                                        {newStudent.academic.grade12.country && getStatesByCountry(newStudent.academic.grade12.country).map(state => (
                                                                            <option key={state} value={state}>{state}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of Board*</label>
                                                                    <input type="text" value={newStudent.academic.grade12.board} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, board: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of Board" />
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of the institution*</label>
                                                                    <input type="text" value={newStudent.academic.grade12.institution} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, institution: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of the institution" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                    <input type="text" value={newStudent.academic.grade12.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                    <select value={newStudent.academic.grade12.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(12th)*</label>
                                                                    <input type="text" value={newStudent.academic.grade12.score} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, score: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Score" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                    <input type="text" value={newStudent.academic.grade12.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                    <input type="date" value={newStudent.academic.grade12.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                    <input type="date" value={newStudent.academic.grade12.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex justify-center md:justify-start">
                                                                <button type="button" onClick={() => alert('Grade 12th details saved.')} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                            </div>
                                                        </section>
                                                    </>
                                                )}

                                                {(['Postgraduate', 'Undergraduate', 'Grade 12', 'Grade 10'].includes(newStudent.academic.highestLevel)) && (
                                                    <>
                                                        <div className="h-px bg-slate-100 my-8"></div>
                                                        <section>
                                                            <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                                <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                                Grade 10th or equivalent
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                    <select value={newStudent.academic.grade10.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Country</option>
                                                                        {getAllCountries().map(country => (
                                                                            <option key={country} value={country}>{country}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                    <select value={newStudent.academic.grade10.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, state: e.target.value } } })} disabled={!newStudent.academic.grade10.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        <option value="">Select State</option>
                                                                        {newStudent.academic.grade10.country && getStatesByCountry(newStudent.academic.grade10.country).map(state => (
                                                                            <option key={state} value={state}>{state}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of Board*</label>
                                                                    <input type="text" value={newStudent.academic.grade10.board} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, board: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of Board" />
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of the institution*</label>
                                                                    <input type="text" value={newStudent.academic.grade10.institution} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, institution: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of the institution" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                    <input type="text" value={newStudent.academic.grade10.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                    <select value={newStudent.academic.grade10.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(10th)*</label>
                                                                    <input type="text" value={newStudent.academic.grade10.score} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, score: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Score" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                    <input type="text" value={newStudent.academic.grade10.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                    <input type="date" value={newStudent.academic.grade10.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                    <input type="date" value={newStudent.academic.grade10.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex justify-center md:justify-start">
                                                                <button type="button" onClick={() => { alert('All academic details saved to profile.'); setProfileTab('work'); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save & Continue</button>
                                                            </div>
                                                            <div className="mt-8 flex justify-center border-t border-dashed border-slate-200 pt-6">
                                                                <button type="button" className="flex items-center gap-2 text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-all">
                                                                    <span className="material-symbols-outlined text-white bg-emerald-500 rounded-full text-[16px] p-0.5">add</span>
                                                                    Add Another
                                                                </button>
                                                            </div>
                                                        </section>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {profileTab === 'work' && (
                                            <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">work</span>
                                                        Professional Experience
                                                    </div>
                                                    {newStudent.workExperience.map((exp, index) => (
                                                        <div key={index} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6 relative group">
                                                            {index > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp.splice(index, 1);
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                                </button>
                                                            )}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employer / Company*</label>
                                                                    <input type="text" value={exp.employer} onChange={e => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp[index].employer = e.target.value;
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Google" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Job Title / Role*</label>
                                                                    <input type="text" value={exp.role} onChange={e => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp[index].role = e.target.value;
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Software Engineer" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                                    <select value={exp.country} onChange={e => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp[index].country = e.target.value;
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Country</option>
                                                                        {getAllCountries().map(country => (
                                                                            <option key={country} value={country}>{country}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                    <input type="date" value={exp.startDate} onChange={e => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp[index].startDate = e.target.value;
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date</label>
                                                                    <input type="date" value={exp.endDate} disabled={exp.current} onChange={e => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp[index].endDate = e.target.value;
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }} className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 ${exp.current ? 'opacity-50' : ''}`} />
                                                                </div>
                                                            </div>
                                                            <div className="mt-4">
                                                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="checkbox" checked={exp.current} onChange={e => {
                                                                        const newExp = [...newStudent.workExperience];
                                                                        newExp[index].current = e.target.checked;
                                                                        if (e.target.checked) newExp[index].endDate = "";
                                                                        setNewStudent({ ...newStudent, workExperience: newExp });
                                                                    }} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                                                                    I currently work here
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewStudent({ ...newStudent, workExperience: [...newStudent.workExperience, { employer: "", role: "", country: "", startDate: "", endDate: "", current: false }] })}
                                                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                                        Add Experience
                                                    </button>
                                                    <div className="mt-8 flex justify-end">
                                                        <button type="button" onClick={() => { alert('Work experience saved.'); setProfileTab('tests'); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save & Continue</button>
                                                    </div>
                                                </section>
                                            </div>
                                        )}

                                        {profileTab === 'tests' && (
                                            <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                                <section>
                                                    <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">terminal</span>
                                                        Standardized Test Scores
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">English Proficiency</h4>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">IELTS Score</label>
                                                                    <input type="text" value={newStudent.tests.ielts} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, ielts: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0.0" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">TOEFL Score</label>
                                                                    <input type="text" value={newStudent.tests.toefl} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, toefl: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">PTE Score</label>
                                                                    <input type="text" value={newStudent.tests.pte} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, pte: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Aptitude Tests</h4>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">GRE Score</label>
                                                                    <input type="text" value={newStudent.tests.gre} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, gre: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">GMAT Score</label>
                                                                    <input type="text" value={newStudent.tests.gmat} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, gmat: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">SAT Score</label>
                                                                    <input type="text" value={newStudent.tests.sat} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, sat: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-center text-center">
                                                            <span className="material-symbols-outlined text-[40px] text-slate-300 mb-4">info</span>
                                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Standardized test scores help in determining the eligibility for various universities and visa requirements.</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 flex justify-end">
                                                        <button type="button" onClick={() => { alert('Test scores saved.'); setProfileTab('family'); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save & Continue</button>
                                                    </div>
                                                </section>
                                            </div>
                                        )}

                                        {/* Action buttons fixed at bottom */}
                                        <div className="sticky bottom-0 mt-8 py-4 bg-[#f8fafc] border-t border-slate-200 flex justify-between items-center z-10">
                                            <button type="button" onClick={resetOnboardModal} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                                            <div className="flex gap-4">
                                                {onboardStep === 1 && onboardMode === 'new' && (
                                                    <button form="quick-register-form" type="submit" disabled={createLoading} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2">
                                                        {createLoading ? 'Registering...' : 'Register & Continue'}
                                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                    </button>
                                                )}
                                                {onboardStep === 1 && onboardMode === 'link' && (
                                                    <button form="link-existing-form" type="submit" disabled={isSearchingUsers} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2">
                                                        {isSearchingUsers ? 'Verifying...' : 'Check & Link Account'}
                                                        <span className="material-symbols-outlined text-[18px]">search</span>
                                                    </button>
                                                )}
                                                {onboardStep === 2 && profileTab === 'personal' && (
                                                    <button form="profile-personal-form" type="submit" disabled={createLoading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50">
                                                        {createLoading ? 'Saving...' : 'Save Changes'}
                                                    </button>
                                                )}
                                                {onboardStep === 2 && profileTab === 'academic' && (
                                                    <button type="button" onClick={() => setProfileTab('work')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                                                        Proceed to Work Experience
                                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                    </button>
                                                )}
                                                {onboardStep === 2 && profileTab === 'family' && (
                                                    <button type="button" onClick={() => setOnboardStep(3)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                                                        Proceed to Documents
                                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : onboardStep === 3 ? (
                                    /* STEP 3: Documents */
                                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12 mt-4">
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[24px]">folder_managed</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900">Applicant Documents</h3>
                                                        <p className="text-xs text-slate-500">Verify existing uploads or add missing documents.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
                                                        if (userId) fetchUserDocuments(userId);
                                                    }}
                                                    disabled={docsLoading}
                                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    <span className={`material-symbols-outlined text-[18px] ${docsLoading ? 'animate-spin' : ''}`}>sync</span>
                                                    {docsLoading ? 'Syncing...' : 'Fetch from Student Profile'}
                                                </button>
                                            </div>

                                            <div className="space-y-10">
                                                {/* Category: Primary Applicant */}
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-5 bg-emerald-50 px-3 py-1 rounded-full w-fit">Primary Applicant Documents</h4>
                                                    <div className="space-y-3">
                                                        {[
                                                            { name: "Passport (Front & Back)", type: "passport", required: true },
                                                            { name: "National ID / Aadhar Card", type: "national_id", required: true },
                                                            { name: "10th Marksheet", type: "marksheet_10", required: true },
                                                            { name: "12th Marksheet", type: "marksheet_12", required: newStudent.academic.highestLevel !== 'Grade 10' },
                                                            { name: "Undergraduate Transcript", type: "ug_transcript", required: ['Undergraduate', 'Postgraduate'].includes(newStudent.academic.highestLevel) },
                                                            { name: "Undergraduate Degree", type: "ug_degree", required: ['Undergraduate', 'Postgraduate'].includes(newStudent.academic.highestLevel) },
                                                            { name: "Postgraduate Transcript", type: "pg_transcript", required: newStudent.academic.highestLevel === 'Postgraduate' },
                                                            { name: "Postgraduate Degree", type: "pg_degree", required: newStudent.academic.highestLevel === 'Postgraduate' },
                                                            { name: "IELTS / TOEFL / PTE Score Card", type: "english_test", required: (newStudent.tests.ielts || newStudent.tests.toefl || newStudent.tests.pte) ? true : false },
                                                            { name: "GRE / GMAT / SAT Score Card", type: "aptitude_test", required: (newStudent.tests.gre || newStudent.tests.gmat || newStudent.tests.sat) ? true : false },
                                                            { name: "Work Experience Letters", type: "work_letters", required: newStudent.workExperience.some(exp => exp.employer !== "") },
                                                            { name: "Resume / CV", type: "resume", required: true },
                                                            // { name: "Statement of Purpose (SOP)", type: "sop", required: true },
                                                            // { name: "Letters of Recommendation (LOR)", type: "lor", required: true },
                                                        ].filter(doc => doc.required).map((doc, i) => {
                                                            const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                            return (
                                                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${existingDoc ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${existingDoc ? 'bg-white text-emerald-500 border border-emerald-100' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                                            <span className="material-symbols-outlined text-[20px]">{existingDoc ? 'task_alt' : 'description'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                {existingDoc && (
                                                                                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                                <p className="text-[10px] text-slate-500 font-medium">{doc.type.toUpperCase().replace('_', ' ')} • PDF/JPG/PNG</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        {existingDoc ? (
                                                                            <>
                                                                                <button onClick={() => window.open(existingDoc.filePath || existingDoc.url, '_blank')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                                                                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                                    Review
                                                                                </button>
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        try {
                                                                                            const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
                                                                                            if (!userId) return;
                                                                                            await authApi.uploadDocument({
                                                                                                userId: userId,
                                                                                                docType: doc.type,
                                                                                                uploaded: true,
                                                                                                filePath: existingDoc.filePath
                                                                                            });
                                                                                            alert(`✅ ${doc.name} verified and updated in user profile!`);
                                                                                            fetchUserDocuments(userId);
                                                                                        } catch (e) {
                                                                                            alert("Failed to update verification status");
                                                                                        }
                                                                                    }}
                                                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">verified</span>
                                                                                    Verify
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="file"
                                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                                    ref={el => {
                                                                                        if (el) fileInputRefs.current[`applicant-${doc.type}`] = el;
                                                                                    }}
                                                                                    onChange={async (e) => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            await handleS3DocumentUpload(
                                                                                                file,
                                                                                                doc.type,
                                                                                                'applicant',
                                                                                                newStudent.basicInfo.firstName + ' ' + newStudent.basicInfo.lastName,
                                                                                                undefined
                                                                                            );
                                                                                            e.target.value = '';
                                                                                        }
                                                                                    }}
                                                                                    hidden
                                                                                />
                                                                                <button
                                                                                    onClick={() => fileInputRefs.current[`applicant-${doc.type}`]?.click()}
                                                                                    disabled={uploadingDocs[`${doc.type}-applicant`] !== undefined}
                                                                                    className="px-5 py-2.5 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">
                                                                                        {uploadingDocs[`${doc.type}-applicant`] !== undefined ? 'hourglass_top' : 'upload'}
                                                                                    </span>
                                                                                    {uploadingDocs[`${doc.type}-applicant`] !== undefined ? 
                                                                                        `${Math.round(uploadingDocs[`${doc.type}-applicant`])}%` : 
                                                                                        'Upload'
                                                                                    }
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Category: Father's Documents */}
                                                <div className="pt-6 border-t border-slate-100">
                                                    <div className="mb-5 flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
                                                            {newStudent.coApplicant.isSameAsFather ? "Father & Co-applicant Documents" : "Father's Documents"} {newStudent.family.fatherName && `(${newStudent.family.fatherName})`}
                                                        </h4>
                                                        {!newStudent.family.fatherEmploymentType && (
                                                            <span className="text-[9px] text-slate-500 font-medium italic">📋 Select employment type to see required documents</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {newStudent.family.fatherEmploymentType ? (
                                                            getRequiredDocuments(newStudent.family.fatherEmploymentType, newStudent.family.fatherName || "Father", 'father').map((doc, i) => (
                                                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${doc.required ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${doc.required ? 'bg-white border-red-200 text-red-500' : 'bg-white border-amber-200 text-amber-500'}`}>
                                                                            <span className="material-symbols-outlined text-[20px]">{doc.required ? 'exclamation' : 'info'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                {doc.required && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">REQUIRED</span>}
                                                                                {!doc.required && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">OPTIONAL</span>}
                                                                            </div>
                                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            ref={el => {
                                                                                if (el) fileInputRefs.current[`father-${doc.type}`] = el;
                                                                            }}
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    await handleS3DocumentUpload(
                                                                                        file,
                                                                                        doc.type,
                                                                                        'father',
                                                                                        newStudent.family.fatherName || 'Father',
                                                                                        newStudent.family.fatherEmploymentType
                                                                                    );
                                                                                    e.target.value = '';
                                                                                }
                                                                            }}
                                                                            hidden
                                                                        />
                                                                        <button
                                                                            onClick={() => fileInputRefs.current[`father-${doc.type}`]?.click()}
                                                                            disabled={uploadingDocs[`${doc.type}-father`] !== undefined}
                                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">
                                                                                {uploadingDocs[`${doc.type}-father`] !== undefined ? 'hourglass_top' : 'upload'}
                                                                            </span>
                                                                            {uploadingDocs[`${doc.type}-father`] !== undefined ? 
                                                                                `${Math.round(uploadingDocs[`${doc.type}-father`])}%` : 
                                                                                'Upload'
                                                                            }
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-600">
                                                                No documents required until employment type is selected in Profile
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Category: Mother's Documents */}
                                                <div className="pt-6 border-t border-slate-100">
                                                    <div className="mb-5 flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
                                                            {newStudent.coApplicant.isSameAsMother ? "Mother & Co-applicant Documents" : "Mother's Documents"} {newStudent.family.motherName && `(${newStudent.family.motherName})`}
                                                        </h4>
                                                        {!newStudent.family.motherEmploymentType && (
                                                            <span className="text-[9px] text-slate-500 font-medium italic">📋 Select employment type to see required documents</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {newStudent.family.motherEmploymentType ? (
                                                            getRequiredDocuments(newStudent.family.motherEmploymentType, newStudent.family.motherName || "Mother", 'mother').map((doc, i) => (
                                                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${doc.required ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${doc.required ? 'bg-white border-red-200 text-red-500' : 'bg-white border-amber-200 text-amber-500'}`}>
                                                                            <span className="material-symbols-outlined text-[20px]">{doc.required ? 'exclamation' : 'info'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                {doc.required && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">REQUIRED</span>}
                                                                                {!doc.required && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">OPTIONAL</span>}
                                                                            </div>
                                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            ref={el => {
                                                                                if (el) fileInputRefs.current[`mother-${doc.type}`] = el;
                                                                            }}
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    await handleS3DocumentUpload(
                                                                                        file,
                                                                                        doc.type,
                                                                                        'mother',
                                                                                        newStudent.family.motherName || 'Mother',
                                                                                        newStudent.family.motherEmploymentType
                                                                                    );
                                                                                    e.target.value = '';
                                                                                }
                                                                            }}
                                                                            hidden
                                                                        />
                                                                        <button
                                                                            onClick={() => fileInputRefs.current[`mother-${doc.type}`]?.click()}
                                                                            disabled={uploadingDocs[`${doc.type}-mother`] !== undefined}
                                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">
                                                                                {uploadingDocs[`${doc.type}-mother`] !== undefined ? 'hourglass_top' : 'upload'}
                                                                            </span>
                                                                            {uploadingDocs[`${doc.type}-mother`] !== undefined ? 
                                                                                `${Math.round(uploadingDocs[`${doc.type}-mother`])}%` : 
                                                                                'Upload'
                                                                            }
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-600">
                                                                No documents required until employment type is selected in Profile
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Category: Other Co-applicant Documents */}
                                                <div className="pt-6 border-t border-slate-100">
                                                    <div className="mb-5 flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1 rounded-full w-fit">Co-applicant Documents {newStudent.coApplicant.name && `(${newStudent.coApplicant.name})`}</h4>
                                                        {!newStudent.coApplicant.employmentType && (
                                                            <span className="text-[9px] text-slate-500 font-medium italic">📋 Select employment type to see required documents</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {newStudent.coApplicant.employmentType ? (
                                                            [
                                                                ...getRequiredDocuments(newStudent.coApplicant.employmentType, newStudent.coApplicant.name || "Co-applicant", 'coapplicant'),
                                                                { name: "Relation Proof with Applicant", type: "coapplicant_relation", required: true }
                                                            ].map((doc, i) => (
                                                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${doc.required ? 'bg-violet-50/50 border-violet-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${doc.required ? 'bg-white border-violet-200 text-violet-500' : 'bg-white border-amber-200 text-amber-500'}`}>
                                                                            <span className="material-symbols-outlined text-[20px]">{doc.required ? 'exclamation' : 'info'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                {doc.required && <span className="px-1.5 py-0.5 bg-violet-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">REQUIRED</span>}
                                                                                {!doc.required && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">OPTIONAL</span>}
                                                                            </div>
                                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            ref={el => {
                                                                                if (el) fileInputRefs.current[`coapplicant-${doc.type}`] = el;
                                                                            }}
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    await handleS3DocumentUpload(
                                                                                        file,
                                                                                        doc.type,
                                                                                        'coapplicant',
                                                                                        newStudent.coApplicant.name || 'Co-applicant',
                                                                                        newStudent.coApplicant.employmentType
                                                                                    );
                                                                                    e.target.value = '';
                                                                                }
                                                                            }}
                                                                            hidden
                                                                        />
                                                                        <button
                                                                            onClick={() => fileInputRefs.current[`coapplicant-${doc.type}`]?.click()}
                                                                            disabled={uploadingDocs[`${doc.type}-coapplicant`] !== undefined}
                                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">
                                                                                {uploadingDocs[`${doc.type}-coapplicant`] !== undefined ? 'hourglass_top' : 'upload'}
                                                                            </span>
                                                                            {uploadingDocs[`${doc.type}-coapplicant`] !== undefined ? 
                                                                                `${Math.round(uploadingDocs[`${doc.type}-coapplicant`])}%` : 
                                                                                'Upload'
                                                                            }
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-600">
                                                                No documents required until employment type is selected in Profile
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sticky bottom-0 mt-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center z-10 px-8 rounded-b-2xl">
                                            <button type="button" onClick={() => setOnboardStep(2)} className="px-8 py-3.5 text-slate-600 font-bold text-[12px] uppercase tracking-widest hover:text-slate-900 transition-all flex items-center gap-2 bg-white border border-slate-200 rounded-2xl">
                                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                                Back to Profile
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleFinalOnboardSubmit}
                                                disabled={createLoading}
                                                className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2 group disabled:opacity-50"
                                            >
                                                {createLoading ? 'Finalizing...' : 'Complete Onboarding'}
                                                {!createLoading && <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">verified</span>}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Step 1 Footer */}
                            {onboardStep === 1 && (
                                <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-4 shrink-0">
                                    <button type="button" onClick={resetOnboardModal} className="px-8 py-3.5 text-slate-500 font-bold text-[12px] uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-200 bg-white rounded-2xl hover:shadow-md">Cancel</button>
                                    <button form="quick-register-form" type="submit" disabled={createLoading} className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-3 group">
                                        {createLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Register Applicant"}
                                        {!createLoading && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {activeSection === "applicants" && (
                        <div className="animate-fade-in max-w-[1400px] mx-auto space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-[26px] font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                        Document Distribution
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            OPERATIONAL
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-[13px] mt-1">Direct workflow: Select student → Pull documents → Share with bank</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <StatCard label="Active Students" value={stats.users?.total || 0} icon="school" color="text-indigo-600" loading={loading} />
                                <StatCard label="Documents Pulled" value="0" icon="folder_zip" color="text-purple-600" loading={loading} />
                                <StatCard label="Shared with Banks" value="0" icon="account_balance" color="text-emerald-600" loading={loading} />
                            </div>

                            {/* Main Action Button */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 text-center">
                                <div className="mb-4">
                                    <span className="text-6xl">📤</span>
                                </div>
                                <h3 className="text-[20px] font-black text-slate-900 mb-2">
                                    Start Pulling & Sharing
                                </h3>
                                <p className="text-[13px] text-slate-600 mb-6 max-w-[400px] mx-auto">
                                    Click below to select a student, pull their documents, and share them directly with a bank in just 3 steps.
                                </p>
                                <button
                                    onClick={() => setShowPullModal(true)}
                                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:shadow-xl transition-all flex items-center gap-3 mx-auto shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                    Open Pull & Share Modal
                                </button>
                            </div>

                            {/* Workflow Steps */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
                                        <span className="material-symbols-outlined text-indigo-600">person_search</span>
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Select Student</h4>
                                    <p className="text-[11px] text-slate-500">Choose the student whose documents you want to pull and share.</p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">2</div>
                                        <span className="material-symbols-outlined text-purple-600">description</span>
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Pull Documents</h4>
                                    <p className="text-[11px] text-slate-500">Review and select which documents to share from the student's profile.</p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">3</div>
                                        <span className="material-symbols-outlined text-emerald-600">business</span>
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Share with Bank</h4>
                                    <p className="text-[11px] text-slate-500">Select the target bank and instantly share the documents.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Selection Content */}
                    {activeSection === "overview" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Operational Overview</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                        Synced: {format(new Date(), 'MMM do, yyyy')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                        className={`px-3 py-1.5 rounded border text-[11px] font-medium transition-all flex items-center gap-1.5 shadow-sm ${autoRefreshEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">{autoRefreshEnabled ? 'sync' : 'sync_disabled'}</span>
                                        {autoRefreshEnabled ? 'Live' : 'Paused'}
                                    </button>
                                    <button
                                        onClick={() => { loadOverview(); setLastRefresh(new Date()); }}
                                        className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px] hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                                        Refresh
                                    </button>
                                    <button onClick={() => setActiveSection('onboarding')} className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px] hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">person_add</span> Add Student
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Total Applications" value={stats.apps?.total} icon="analytics" color="text-indigo-600" loading={loading} />
                                <StatCard label="Awaiting Review" value={pendingCount} icon="hourglass_empty" color="text-amber-600" loading={loading} hint="Action Needed" />
                                <StatCard label="Approval Rate" value={`${approvalRate}%`} icon="verified" color="text-emerald-600" loading={loading} trend={approvalRate > 50 ? 5 : -3} />
                                <StatCard label="Total Users" value={stats.users?.total ?? 0} icon="group" color="text-slate-600" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Pipeline Breakdown */}
                                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[16px]">donut_large</span>
                                        Application Pipeline
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(stats.apps?.statusStats || {}).sort(([, a]: any, [, b]: any) => b - a).map(([status, value]: any) => {
                                            let color = "bg-slate-500", textColor = "text-slate-700", bg = "bg-slate-50";
                                            if (['approved', 'disbursed'].includes(status)) { color = "bg-emerald-500"; textColor = "text-emerald-700"; bg = "bg-emerald-50"; }
                                            else if (['pending', 'submitted', 'documents_pending', 'draft'].includes(status)) { color = "bg-amber-400"; textColor = "text-amber-700"; bg = "bg-amber-50"; }
                                            else if (status === 'processing') { color = "bg-indigo-500"; textColor = "text-indigo-700"; bg = "bg-indigo-50"; }
                                            else if (['rejected', 'cancelled'].includes(status)) { color = "bg-rose-500"; textColor = "text-rose-700"; bg = "bg-rose-50"; }
                                            const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                                            const total = totalApps || 1;
                                            return (
                                                <div key={label}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[12px] font-medium text-slate-700">{label}</span>
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${bg} ${textColor}`}>{value} / {total}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${Math.round((value / total) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(stats.apps?.statusStats || {}).length === 0 && !loading && (
                                            <div className="text-[12px] font-medium text-slate-500 text-center py-2">No pipeline data available</div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-slate-900">{approvedCount + rejectedCount}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Processed</p>
                                        </div>
                                        <div className="text-center border-x border-slate-100">
                                            <p className="text-lg font-semibold text-slate-900">{Number(stats.users?.total ?? 0)}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Users</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-rose-600">{rejectedCount + Number(stats.apps?.cancelled ?? 0)}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Rejected</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Feed + Quick Actions */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                        <h3 className="text-[11px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] uppercase tracking-wider mb-3">Recent Activity</h3>
                                        <div className="space-y-2.5">
                                            {recentActivity.map(a => (
                                                <div key={a.id} className="flex items-start gap-2.5">
                                                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${a.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{a.icon}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-medium text-slate-800 leading-snug">{a.msg}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <button onClick={() => { setActiveSection('chat_customer'); setAutoStartUser(null); }} className="w-full text-left p-3 rounded border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center gap-3 bg-white shadow-sm">
                                            <span className="material-symbols-outlined text-indigo-500 text-[18px]">forum</span>
                                            <span className="text-[12px] font-medium text-slate-800">Support Chat</span>
                                            <span className="material-symbols-outlined text-slate-300 ml-auto text-[14px]">arrow_forward_ios</span>
                                        </button>
                                        <button onClick={() => setActiveSection('applicants')} className="w-full text-left p-3 rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center gap-3 bg-white shadow-sm">
                                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">manage_accounts</span>
                                            <span className="text-[12px] font-medium text-slate-800">Applicant Profiles</span>
                                            <span className="material-symbols-outlined text-slate-300 ml-auto text-[14px]">arrow_forward_ios</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "tasks" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-[26px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] tracking-tight flex items-center gap-3">
                                        Action Items
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            PRIORITY
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-[13px] mt-1">Manage your daily tasks, follow-ups, and internal reminders.</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm max-w-3xl">
                                <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex gap-3 mb-5">
                                    <input
                                        type="text"
                                        placeholder="Add a new task..."
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
                                    />
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-all shadow-sm">Add Task</button>
                                </form>
                                <div className="space-y-2">
                                    {tasks.map(task => (
                                        <div key={task.id} className={`flex items-center gap-3 p-3 rounded border transition-all group ${task.completed ? 'bg-slate-50/50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                            <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-transparent border border-slate-300 group-hover:border-indigo-400'}`}>
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </button>
                                            <span className={`flex-1 text-[13px] font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded transition-all">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "performance" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-[26px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] tracking-tight flex items-center gap-3">
                                        Analytical Insights
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[11px] font-semibold text-violet-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                            PERFORMANCE
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-[13px] mt-1 flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {autoRefreshEnabled ? 'Live monitoring active' : 'Metrics synced manually'}
                                    </p>
                                </div>
                                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 shadow-sm">
                                    <span className="material-symbols-outlined text-[16px]">military_tech</span>
                                    TOP 5% CONTRIBUTOR
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Applications Processed" value="342" icon="task" color="text-indigo-600" loading={false} trend={8} />
                                <StatCard label="Avg. Resolution Time" value="4.2 Hrs" icon="timer" color="text-amber-600" loading={false} />
                                <StatCard label="Customer Rating" value="4.9/5.0" icon="star" color="text-emerald-600" loading={false} trend={2} />
                                <StatCard label="Tasks Completed" value={tasks.filter(t => t.completed).length + 28} icon="fact_check" color="text-blue-600" loading={false} />
                            </div>
                        </div>
                    )}

                    {activeSection === "communications" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-[26px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] tracking-tight flex items-center gap-3">
                                        Outreach Center
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            GLOBAL READY
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Coordinate direct and bulk communication across all platform entities.</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-3xl">
                                <h3 className="text-[11px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-[16px]">send</span>
                                    Compose Message
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded w-fit mb-4">
                                        <button onClick={() => setEmailData({ ...emailData, isBulk: false })} className={`px-3 py-1.5 rounded text-[11px] font-medium transition-all ${!emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Direct</button>
                                        <button onClick={() => setEmailData({ ...emailData, isBulk: true })} className={`px-3 py-1.5 rounded text-[11px] font-medium transition-all ${emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Bulk</button>
                                    </div>
                                    <button onClick={handleSendEmail} disabled={emailLoading} className="w-full bg-indigo-600 text-white py-2.5 rounded text-[11px] font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm">
                                        {emailLoading ? (
                                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[16px]">send</span>
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {["applications", "blogs", "community", "users"].includes(activeSection) && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    {activeSection === 'applications' && (
                                        <p className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">STAFF DASHBOARD</p>
                                    )}
                                    <h2 className={`text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]`}>
                                        {activeSection === 'overview' ? 'Operational Overview' : activeSection === 'community' ? 'Engagement Hub' : activeSection === 'blogs' ? 'Editorial Content' : activeSection === 'users' ? 'User Directory' : 'Active Pipeline'}
                                        {activeSection === 'applications' && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-sans font-semibold text-emerald-700 ml-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                LIVE SYSTEM
                                            </span>
                                        )}
                                        {activeSection === 'users' && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                MANAGE ALL USERS
                                            </span>
                                        )}
                                        {activeSection === 'blogs' && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                PUBLISHED CONTENT
                                            </span>
                                        )}
                                        {activeSection === 'community' && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                LIVE HUB
                                            </span>
                                        )}
                                    </h2>
                                    {/* {activeSection === 'applications' && (
                                        <p className="text-slate-500 text-[13px] mt-1">Review, approve, and track real-time applications and processing pipelines.</p>
                                    )}
                                    {activeSection === 'users' && (
                                        <p className="text-slate-500 text-[13px] mt-1">Manage accounts, roles, and access controls across the platform.</p>
                                    )}
                                    {activeSection === 'blogs' && (
                                        <p className="text-slate-500 text-[13px] mt-1">Create, edit, and publish editorial content and resources.</p>
                                    )}
                                    {activeSection === 'community' && (
                                        <p className="text-slate-500 text-[13px] mt-1">Monitor discussions, engage with users, and moderate threads.</p>
                                    )} */}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {activeSection === 'applications' && (
                                        <>
                                            {/* <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors mr-2">
                                                Apply Filters
                                            </button> */}
                                            <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                                                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                                                Filters
                                            </button>
                                            {/* <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                                Add Application
                                            </button> */}
                                        </>
                                    )}
                                    <button
                                        onClick={() => { loadData(); setLastRefresh(new Date()); }}
                                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                                        Refresh
                                    </button>
                                    {activeSection === 'users' && (
                                        <button
                                            onClick={() => setActiveSection('onboarding')}
                                            className="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                                            Onboard Applicant
                                        </button>
                                    )}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Search ${activeSection}...`}
                                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-['Playfair_Display',serif] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 w-64 shadow-sm"
                                        />
                                    </div>
                                    {activeSection === 'applications' && (
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-['Playfair_Display',serif] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all shadow-sm"
                                        >
                                            <option value="all">ALL STATUS</option>
                                            <option value="pending">PENDING</option>
                                            <option value="processing">PROCESSING</option>
                                            <option value="approved">APPROVED</option>
                                            <option value="rejected">REJECTED</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* User Directory — stat mini-cards */}
                            {activeSection === 'users' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-2">
                                    {userStatsData.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setUserRoleFilter(c.id)}
                                            className={`bg-white rounded-xl border ${userRoleFilter === c.id ? 'ring-2 ring-indigo-500 border-indigo-200 shadow-md' : c.border} p-4 text-left transition-all hover:shadow-md active:scale-[0.98]`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
                                                    <span className={`material-symbols-outlined text-[18px] ${c.color}`}>{c.icon}</span>
                                                </div>
                                                <span className={`text-[9px] font-['Playfair_Display',serif] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.bg} ${c.color}`}>{c.tag}</span>
                                            </div>
                                            <p className="text-[24px] font-bold text-slate-900 leading-none mb-1">{loading ? <span className="block w-8 h-6 bg-slate-100 animate-pulse rounded" /> : c.value}</p>
                                            <p className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-500 uppercase tracking-widest">{c.label}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Blogs — stat mini-cards */}
                            {activeSection === 'blogs' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-2">
                                    {blogStatsData.map((c, i) => (
                                        <div key={i} className={`bg-white rounded-xl border ${c.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
                                                    <span className={`material-symbols-outlined text-[18px] ${c.color}`}>{c.icon}</span>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.bg} ${c.color}`}>{c.tag}</span>
                                            </div>
                                            <p className="text-[24px] font-bold text-slate-900 leading-none mb-1">{loading ? <span className="block w-8 h-6 bg-slate-100 animate-pulse rounded" /> : c.value}</p>
                                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Community — stat mini-cards */}
                            {activeSection === 'community' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-2">
                                    {communityStatsData.map((c, i) => (
                                        <div key={i} className={`bg-white rounded-xl border ${c.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
                                                    <span className={`material-symbols-outlined text-[18px] ${c.color}`}>{c.icon}</span>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.bg} ${c.color}`}>{c.tag}</span>
                                            </div>
                                            <p className="text-[24px] font-bold text-slate-900 leading-none mb-1">{loading ? <span className="block w-8 h-6 bg-slate-100 animate-pulse rounded" /> : c.value}</p>
                                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white font-['Plus_Jakarta_Sans',sans-serif]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <TableHeader>
                                            {activeSection === "blogs" && (
                                                <>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">article</span> POST METADATA</span></th>
                                                    <th className="px-5 py-3.5 w-32"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">toggle_on</span> STATUS</span></th>
                                                    <th className="px-5 py-3.5 w-40 text-right"><span className="flex items-center justify-end gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">insights</span> ENGAGEMENT</span></th>
                                                    <th className="px-5 py-3.5 w-48 text-right"><span className="flex items-center justify-end gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">calendar_today</span> LAST MODIFIED</span></th>
                                                    <th className="px-5 py-3.5 w-28 text-center"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">ACTIONS</span></th>
                                                </>
                                            )}
                                            {activeSection === "applications" && (
                                                <>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">APPLICANT PROFILE</span></th>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">COLLEGE NAME</span></th>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">PROGRAM FOCUS</span></th>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">TARGET BANK</span></th>
                                                    <th className="px-5 py-5 w-48"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">PROGRESS</span></th>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">CURRENT STATUS</span></th>
                                                    <th className="px-5 py-5 text-center"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">ACTIONS</span></th>
                                                </>
                                            )}
                                            {activeSection === "users" && (
                                                <>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">person</span> PROFILE</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">mail</span> CONTACT</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">verified_user</span> ACCESS ROLE</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">schedule</span> LAST SESSION</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">calendar_today</span> REGISTERED</span></th>
                                                    <th className="px-5 py-3.5 text-center"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">ACTIONS</span></th>
                                                </>
                                            )}
                                            {activeSection === "community" && (
                                                <>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">forum</span> BROADCAST TOPIC</span></th>
                                                    <th className="px-5 py-3.5 w-48"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">person</span> TRANSMITTER</span></th>
                                                    <th className="px-5 py-3.5 w-40 text-right"><span className="flex items-center justify-end gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">favorite</span> SOCIAL SIGNAL</span></th>
                                                    <th className="px-5 py-3.5 w-28 text-center"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">ACTIONS</span></th>
                                                </>
                                            )}
                                        </TableHeader>
                                        <tbody className="divide-y divide-slate-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-32 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-4">
                                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                                                            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Synchronizing Nodes...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                    {activeSection === "blogs" && (
                                                        <>
                                                            <td className="px-5 py-4">
                                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight mb-1">{item.title}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <span className="material-symbols-outlined text-[12px]">edit</span>
                                                                    Writer: {item.authorName}
                                                                </p>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                    {item.isPublished ? 'Live' : 'Draft'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="inline-flex flex-col items-end">
                                                                    <p className="text-[13px] font-black text-slate-900 tabular-nums">{item.views || 0} READS</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4.8 Avg Rating</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <p className="text-[12px] font-bold text-slate-800 uppercase tabular-nums">
                                                                    {item.updatedAt ? format(new Date(item.updatedAt), 'MMM d, yyyy') : 'NOT_MODIFIED'}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Automated Sync</p>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => window.open(`/blogs/${item.id || item._id}`, '_blank')} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm" title="View Article">
                                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                    </button>
                                                                    <button onClick={() => handleToggleBlogStatus(item)} className={`w-8 h-8 rounded-lg bg-white border border-slate-200 ${item.isPublished ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'} hover:border-slate-300 flex items-center justify-center transition-all shadow-sm`} title={item.isPublished ? "Unpublish" : "Publish"}>
                                                                        <span className="material-symbols-outlined text-[18px]">{item.isPublished ? 'archive' : 'publish'}</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteBlog(item.id || item._id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-all shadow-sm" title="Delete">
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "applications" && (() => {
                                                        const progress = item.progress ?? 10;
                                                        const statusKey = (item.status || 'draft').toLowerCase();
                                                        const statusColors: Record<string, string> = {
                                                            draft: 'bg-amber-50 text-amber-600 border border-amber-200',
                                                            pending: 'bg-amber-50 text-amber-600 border border-amber-200',
                                                            submitted: 'bg-blue-50 text-blue-600 border border-blue-200',
                                                            processing: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
                                                            approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                                            verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                                            rejected: 'bg-rose-50 text-rose-600 border border-rose-200',
                                                            disbursed: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                                                        };
                                                        const barColor = statusKey === 'approved' || statusKey === 'verified' || statusKey === 'disbursed' ? 'bg-indigo-500' : statusKey === 'rejected' ? 'bg-rose-400' : 'bg-emerald-500';
                                                        const initials = `${(item.firstName || item.student?.firstName || '?')[0]}${(item.lastName || item.student?.lastName || '')[0] || ''}`;
                                                        const stageLabel = item.currentStage || (progress <= 12 ? 'Application Created' : progress <= 40 ? 'Documents Uploaded' : progress <= 70 ? 'Under Review' : progress <= 85 ? 'Credit Check' : progress <= 90 ? 'Sanction' : 'Disbursement');
                                                        return (
                                                            <>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-medium text-[13px] text-slate-600 shrink-0">
                                                                            {initials}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[15px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] leading-tight truncate">{item.firstName || item.student?.firstName || '—'} {item.lastName || item.student?.lastName || ''}</p>
                                                                            <p className="text-[9px] text-slate-600 font-black mt-1 uppercase tracking-widest">APP-{(item.id || item._id || 'UNKNOWN').slice(-6)}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <p className="text-[15px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate max-w-[180px]">{item.universityName || item.college || '—'}</p>
                                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">COLLEGE/UNIVERSITY</p>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <p className="text-[15px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate max-w-[120px]">{item.courseName || item.program || item.courseLevel || '—'}</p>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex items-center">
                                                                        {(() => {
                                                                            const bName = (item.bank || item.targetBank || '').toLowerCase();
                                                                            if (bName.includes('idfc')) return <img src="/images/lenders/idfc-first-bank.jpg" alt="IDFC FIRST Bank" className="h-7 w-auto object-contain" />;
                                                                            if (bName.includes('avanse')) return <img src="/images/lenders/avanse.jpg" alt="Avanse" className="h-10 w-auto object-contain" />;
                                                                            if (bName.includes('auxilo')) return <img src="/images/lenders/auxilo.png" alt="Auxilo" className="h-16 w-auto object-contain" />;
                                                                            if (bName.includes('credila') || bName.includes('hdfc')) return <img src="/images/lenders/hdfc-credila.png" alt="Credila" className="h-6 w-auto object-contain" />;
                                                                            if (bName.includes('poonawalla')) return <img src="/images/lenders/poonawalla.png" alt="Poonawalla" className="h-8 w-auto object-contain" />;
                                                                            return <div className="text-[#0d1b2a] font-black text-[13px] uppercase truncate max-w-[100px]">{item.bank || item.targetBank || '—'}</div>;
                                                                        })()}
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors" style={{ minWidth: 160 }}>
                                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                                                                        <div className={`h-1.5 rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-[#4f46e5]'}`} style={{ width: `${progress}%` }} />
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px]">✨</span>
                                                                        <p className="text-[10px] font-bold text-slate-700">{stageLabel}</p>
                                                                        <span className="text-[10px] font-bold text-[#4f46e5] ml-auto">{progress}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex flex-col items-start gap-1.5">
                                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColors[statusKey] || 'bg-amber-50/50 text-amber-600 border-amber-200'}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusKey === 'rejected' ? 'bg-rose-500' : statusKey === 'approved' || statusKey === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                            {item.status || 'DRAFT'}
                                                                        </span>
                                                                        <div className="text-[8px] text-slate-500 font-medium">
                                                                            <p>Submitted: {item.submittedAt ? format(new Date(item.submittedAt), "MMM d, yyyy") : '—'}</p>
                                                                            <p>Now: {format(new Date(), "MMM d, yyyy • HH:mm:ss")}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 text-center border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="relative inline-block text-left">
                                                                        <button
                                                                            onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                                                            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm mx-auto"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                                        </button>

                                                                        {activeMenuId === item.id && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                                                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200 font-sans">
                                                                                    <button
                                                                                        onClick={() => { setSelectedApp(item); setActiveMenuId(null); }}
                                                                                        className="w-full flex items-center gap-4 px-5 py-3 text-[12px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[18px] text-indigo-500">visibility</span>
                                                                                        View Application
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => { setSearchQuery(item.email || item.student?.email); setActiveMenuId(null); }}
                                                                                        className="w-full flex items-center gap-4 px-5 py-3 text-[12px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[18px] text-emerald-500">list_alt</span>
                                                                                        All Applications
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </>
                                                        );
                                                    })()}
                                                    {activeSection === "users" && (() => {
                                                        const roleMap: Record<string, { label: string; color: string; dot: string }> = {
                                                            user: { label: 'USER', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
                                                            student: { label: 'STUDENT', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
                                                            staff: { label: 'STAFF', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
                                                            staff_admin: { label: 'STAFF', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
                                                            bank: { label: 'BANK', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
                                                            admin: { label: 'ADMIN', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
                                                        };
                                                        const roleKey = item.role?.toLowerCase() || 'user';
                                                        const roleInfo = roleMap[roleKey] || roleMap['user'];
                                                        const initials = `${(item.firstName || '?')[0]}${(item.lastName || '')[0] || ''}`.toUpperCase();
                                                        const avatarColors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700'];
                                                        const avatarColor = avatarColors[(item.firstName?.charCodeAt(0) || 0) % avatarColors.length];
                                                        return (
                                                            <>
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        {/* Avatar */}
                                                                        <div className="relative flex-shrink-0">
                                                                            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 ${avatarColor} flex items-center justify-center font-bold text-[13px]`}>
                                                                                <img
                                                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.email}`}
                                                                                    alt={initials}
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                                />
                                                                            </div>
                                                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${item.last_login_at ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                                                                                {item.firstName || '—'} {item.lastName || ''}
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-900 font-bold font-mono mt-1">
                                                                                ID: {(item.id || item._id || '').slice(0, 12)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <p className="text-[13px] text-slate-700 font-medium">{item.email}</p>
                                                                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                                                                        <span className="material-symbols-outlined text-[12px]">phone_enabled</span>
                                                                        {item.phone || item.mobile || item.phoneNumber || '—'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleInfo.color}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                                                                        {roleInfo.label}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {item.last_login_at ? (
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                                                                                <span className="material-symbols-outlined text-[13px] text-emerald-500">pin_drop</span>
                                                                                {item.last_login_location || 'Unknown location'}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                                                                <span className="flex items-center gap-1">
                                                                                    <span className="material-symbols-outlined text-[11px]">devices</span>
                                                                                    {item.last_login_device?.split(' - ')[0] || 'Unknown'}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <span className="material-symbols-outlined text-[11px]">router</span>
                                                                                    {item.last_login_ip || '—'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Never Logged In</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {item.createdAt ? (
                                                                        <>
                                                                            <p className="text-[12px] font-semibold text-slate-800">{format(new Date(item.createdAt), 'MMM d, yyyy').toUpperCase()}</p>
                                                                            <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(item.createdAt), 'hh:mm aa')}</p>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-[10px] font-mono text-slate-400">NO_RECORD</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => window.open(`/staff/users/${item.id || item._id}`, '_blank')}
                                                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
                                                                            title="View Profile"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">account_circle</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setAutoStartUser(item); setActiveSection("chat_customer"); }}
                                                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
                                                                            title="Direct Message"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">chat</span>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        );
                                                    })()}
                                                    {activeSection === "community" && (
                                                        <>
                                                            <td className="px-5 py-4">
                                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight line-clamp-1">{item.title}</p>
                                                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">Topic ID</span>
                                                                    THR-{(item.id || item._id || '').slice(-6).toUpperCase()}
                                                                </p>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author?.email}`} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[12px] font-bold text-slate-800 truncate">{item.author?.firstName || 'Community'}</p>
                                                                        <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-widest">Active Member</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="inline-flex items-center gap-4">
                                                                    <div className="text-center">
                                                                        <p className="text-[13px] font-black text-slate-900 tabular-nums">{item.likes?.length || 0}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reactions</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-[13px] font-black text-slate-900 tabular-nums">{item.comments?.length || 0}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Replies</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => window.open(`/community/post/${item.id || item._id}`, '_blank')} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm" title="Open Thread">
                                                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteCommunityPost(item.id || item._id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-all shadow-sm" title="Remove Post">
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-32 text-center">
                                                        <div className="flex flex-col items-center justify-center opacity-40">
                                                            <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                                                            <p className="text-sm font-bold uppercase tracking-wider">Zero Records Found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* My Profile Section */}
                    {activeSection === "my_profile" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">My Profile</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium">Staff account & credentials</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Profile Card */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden mb-5 shadow-lg">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="text-[20px] font-black text-slate-900 tracking-tight">{user?.firstName || '—'} {user?.lastName || ''}</h3>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mt-1">{user?.role?.replace('_', ' ') || 'Staff'}</p>
                                    <p className="text-[13px] text-slate-500 mt-2">{user?.email}</p>
                                    <div className="mt-6 w-full pt-6 border-t border-slate-100 space-y-3">
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-slate-400 font-medium">Status</span>
                                            <span className="font-black text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />Active</span>
                                        </div>
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-slate-400 font-medium">Portal</span>
                                            <span className="font-bold text-slate-700">CoreOps Staff</span>
                                        </div>
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-slate-400 font-medium">Session</span>
                                            <span className="font-bold text-slate-700">{format(new Date(), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Stats Summary */}
                                <div className="lg:col-span-2 grid grid-cols-2 gap-5 content-start">
                                    {[
                                        { label: "Applications Managed", value: totalApps, icon: "description", color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Pending Review", value: pendingCount, icon: "hourglass_empty", color: "bg-amber-50 text-amber-600" },
                                        { label: "Approved This Month", value: approvedCount, icon: "check_circle", color: "bg-emerald-50 text-emerald-600" },
                                        { label: "Rejection Rate", value: totalApps > 0 ? `${Math.round((rejectedCount / totalApps) * 100)}%` : '0%', icon: "cancel", color: "bg-rose-50 text-rose-600" },
                                        { label: "Tasks Completed", value: tasks.filter(t => t.completed).length, icon: "fact_check", color: "bg-slate-100 text-slate-600" },
                                        { label: "Tasks Pending", value: tasks.filter(t => !t.completed).length, icon: "pending_actions", color: "bg-violet-50 text-violet-600" },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
                                                <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-[22px] font-black text-slate-900 leading-none">{loading ? '—' : s.value}</p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-1">{s.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Recent Activity */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-7 shadow-sm">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Recent Activity Log</h3>
                                <div className="space-y-3">
                                    {recentActivity.map(a => (
                                        <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                                                <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                                            </div>
                                            <p className="flex-1 text-[13px] font-bold text-slate-700">{a.msg}</p>
                                            <span className="text-[11px] text-slate-400 font-medium shrink-0">{a.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {selectedApp && (
                <ApplicationDetailView
                    application={selectedApp}
                    onBack={() => setSelectedApp(null)}
                />
            )}

            <PullDocumentsModal
                isOpen={showPullModal}
                onClose={() => setShowPullModal(false)}
            />

        </div>
    );
}
