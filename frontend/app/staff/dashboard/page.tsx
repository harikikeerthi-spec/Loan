"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { io } from "socket.io-client";
import { adminApi, authApi, documentApi, onboardingApi, staffProfileApi, referenceApi, applicationApi } from "@/lib/api";
import { HttpApiPaths } from "@/lib/http-api-paths";
import { normalizeOcrFieldsForAutofill, normalizeGenderForForm, normalizeCountryName, parseOcrDateForInput } from "@/lib/ocr-fields";
import { examYearToEndDate, inferStartDate, normalizeStateName } from "@/lib/academic-ocr";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";
import ApplicantsSection from "@/components/staff/ApplicantsSection";
import PullDocumentsModal from "@/components/staff/PullDocumentsModal";
import ApplicationDetailView from "@/components/staff/ApplicationDetailView";
import { getAllCountries, getStatesByCountry } from "@/lib/countriesData";
import { formatPhone, formatAadhar, formatPan, isPhoneValid, isAadharValid, isPanValid } from "@/lib/validation";
import {
    getPersonDocumentRequirements,
    getProfileDocumentRequirements,
    getStudentDocumentRequirements,
    type DocumentRequirement,
} from "@/lib/documentRequirements";
import ActivityLogWidget from "@/components/staff/ActivityLogWidget";
import ShareProfileToBankModal from "@/components/staff/ShareProfileToBankModal";
import NotificationsPanel from "@/components/staff/NotificationsPanel";

// --- Components ---

const DASHBOARD_SECTIONS = [
    "overview",
    "applicants",
    "applications",
    "tasks",
    "performance",
    "users",
    "blogs",
    "community",
    "communications",
    "chat_customer",
    "activities",
    "my_profile",
    "onboarding",
] as const;

const getDashboardSection = (section: string | null) =>
    DASHBOARD_SECTIONS.includes(section as any) ? section as typeof DASHBOARD_SECTIONS[number] : "overview";

const getDashboardPage = (page: string | null) => {
    const parsed = Number(page);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const StatCard = ({ label, value, icon, color, trend, loading, hint, badge, ...props }: any) => {
    // Generate styling based on the color string to keep the UI clean
    let colorScheme = {
        iconBg: 'bg-slate-50',
        iconText: 'text-slate-600',
        valueText: 'text-slate-900',
        trendBg: 'bg-slate-50',
        trendText: 'text-slate-500'
    };

    if (color?.includes('blue')) {
        colorScheme = { iconBg: 'bg-blue-50', iconText: 'text-blue-500', valueText: 'text-slate-900', trendBg: 'bg-slate-50', trendText: 'text-slate-500' };
    } else if (color?.includes('amber')) {
        colorScheme = { iconBg: 'bg-amber-50', iconText: 'text-amber-500', valueText: 'text-slate-900', trendBg: 'bg-amber-50/50', trendText: 'text-amber-700' };
    } else if (color?.includes('green') || color?.includes('emerald')) {
        colorScheme = { iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', valueText: 'text-slate-900', trendBg: 'bg-emerald-50/50', trendText: 'text-emerald-700' };
    } else if (color?.includes('purple') || color?.includes('indigo')) {
        colorScheme = { iconBg: 'bg-purple-50', iconText: 'text-purple-500', valueText: 'text-slate-900', trendBg: 'bg-slate-50', trendText: 'text-slate-500' };
    }

    return (
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:border-indigo-200 flex flex-col justify-between min-h-[140px]">
            {/* Visual Indicator (e.g. amber urgency tint or subtle background) */}
            {color?.includes('amber') && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            )}

            {/* Top row: Metric Title + Icon */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorScheme.iconBg} ${colorScheme.iconText}`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                </div>
            </div>

            {/* Middle row: Large primary number */}
            <div className="mt-1 mb-3 relative z-10 flex items-center gap-3">
                <div className={`staff-dashboard-number text-[42px] font-bold tracking-normal leading-none ${colorScheme.valueText}`}>
                    {loading ? <span className="h-10 bg-slate-100 animate-pulse rounded block w-20" /> : value ?? "—"}
                </div>
                {badge && !loading && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-700">{badge}</span>
                    </div>
                )}
            </div>

            {/* Bottom Row: Micro-trend / Context text */}
            <div className="mt-auto relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {trend !== undefined && !loading && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${colorScheme.trendBg} ${colorScheme.trendText}`}>
                            {typeof trend === 'string' && (trend.includes('⏳') || trend.includes('📈')) ? null : (
                                <span className="material-symbols-outlined text-[12px]">
                                    {Number(trend) >= 0 ? 'trending_up' : 'trending_down'}
                                </span>
                            )}
                            {trend}
                        </div>
                    )}
                    {hint && !loading && (
                        <span className="text-[10px] font-medium text-slate-400 border-l border-slate-200 pl-2 ml-1">
                            {hint}
                        </span>
                    )}
                </div>
                {props.footerAction && !loading && (
                    <button onClick={props.onFooterActionClick} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                        {props.footerAction}
                    </button>
                )}
            </div>
        </div>
    );
};

const NavItem = ({ section, active, icon, label, badge, expanded, onClick }: any) => {
    const isActive = active === section;
    return (
        <button
            onClick={() => onClick(section)}
            title={label}
            className={`relative w-full flex items-center gap-3 px-4 transition-all duration-150 group/item ${isActive
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
            <span className={`relative z-10 text-[16px] font-['Playfair_Display',serif] tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300
                ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto'}
                ${isActive ? 'text-white font-medium' : 'text-slate-300'}`}>
                {label}
            </span>
            {badge > 0 && (
                <span className={`relative z-10 ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    bg-rose-500 text-white transition-opacity duration-300
                    ${expanded ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`}>
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

function safeParseJson(val: any, fallback: any) {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        } catch (e) {
            console.error("Failed to parse JSON string:", val, e);
            return fallback;
        }
    }
    return fallback;
}

/** Fresh applicant profile — KYC/personal fields empty until student enters or uploads documents. */
function createEmptyNewStudent() {
    return {
        email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "student",
        dob: "", gender: "", maritalStatus: "", pan: "", aadhaarNumber: "",
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
        },
        loanAmount: "",
        targetUniversity: "",
        studyDestination: "",
        courseName: "",
        budget: "",
        pincode: "",
        admitStatus: "",
        intakeSeason: "",
        goal: ""
    };
}

export default function StaffDashboardPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState(() => getDashboardSection(searchParams.get("section")));
    const [loading, setLoading] = useState(true);
    const [nowTime, setNowTime] = useState<Date>(new Date());
    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);
    const [stats, setStats] = useState<any>({});
    const [data, setData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [autoStartUser, setAutoStartUser] = useState<any>(null);
    const [showPullModal, setShowPullModal] = useState(false);
    const [showShareProfileModal, setShowShareProfileModal] = useState(false);
    const [shareProfileData, setShareProfileData] = useState<any>(null);

    // Premium Document Upload Popup States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<string>("passport");
    const [selectedDocCategory, setSelectedDocCategory] = useState<'applicant' | 'father' | 'mother' | 'coapplicant'>('applicant');
    const [selectedDocName, setSelectedDocName] = useState<string>("Passport");

    const getModalDocumentsList = () => {
        const allDocs = getProfileDocumentRequirements(newStudent);

        let activeGroup: 'student_identity' | 'student_academic' | 'father' | 'mother' | 'coapplicant' = 'student_identity';

        if (selectedDocType.startsWith('father_')) {
            activeGroup = 'father';
        } else if (selectedDocType.startsWith('mother_')) {
            activeGroup = 'mother';
        } else if (selectedDocType.startsWith('coapplicant_')) {
            activeGroup = 'coapplicant';
        } else if (['marksheet_10', 'marksheet_12', 'ug_transcript', 'ug_degree', 'pg_transcript', 'pg_degree', 'english_test', 'aptitude_test', 'resume', 'work_letters'].includes(selectedDocType)) {
            activeGroup = 'student_academic';
        }

        if (activeGroup === 'student_identity') {
            return {
                title: "Student KYC & Identity",
                icon: "fingerprint",
                items: allDocs.filter(d => ['passport', 'national_id', 'pan'].includes(d.type))
            };
        } else if (activeGroup === 'student_academic') {
            return {
                title: "Student Academic Docs",
                icon: "school",
                items: allDocs.filter(d => ['marksheet_10', 'marksheet_12', 'ug_transcript', 'ug_degree', 'pg_transcript', 'pg_degree', 'english_test', 'aptitude_test', 'resume', 'work_letters'].includes(d.type))
            };
        } else if (activeGroup === 'father') {
            const fatherName = newStudent.family.fatherName || "Father";
            return {
                title: `${fatherName}'s Documents`,
                icon: "hail",
                items: allDocs.filter(d => d.type.startsWith('father_'))
            };
        } else if (activeGroup === 'mother') {
            const motherName = newStudent.family.motherName || "Mother";
            return {
                title: `${motherName}'s Documents`,
                icon: "woman",
                items: allDocs.filter(d => d.type.startsWith('mother_'))
            };
        } else if (activeGroup === 'coapplicant') {
            const coName = newStudent.coApplicant.name || "Co-applicant";
            return {
                title: `${coName}'s Documents`,
                icon: "group",
                items: allDocs.filter(d => d.type.startsWith('coapplicant_'))
            };
        }

        return {
            title: "Documents",
            icon: "folder",
            items: []
        };
    };

    const [countryOfEducation, setCountryOfEducation] = useState<string>("India");
    const [highestEducation, setHighestEducation] = useState<string>("Select Level");
    const [selectedTestType, setSelectedTestType] = useState<string>("Select Test");
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [onlineEmails, setOnlineEmails] = useState<string[]>([]);
    const socketRef = useRef<any>(null);

    // Initialize real-time WebSocket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || (
            typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
                ? window.location.origin
                : 'http://localhost:5000'
        );
        const socketUrl = baseApiUrl.endsWith('/api')
            ? baseApiUrl.replace('/api', '/chat')
            : `${baseApiUrl.replace(/\/$/, '')}/chat`;

        console.log("[StaffDashboard] Connecting to WebSocket at", socketUrl);
        const socketInstance = io(socketUrl, {
            auth: { token }
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('[StaffDashboard] Socket connected successfully');
            socketInstance.emit('request_presence');
        });

        socketInstance.on('presence_update', (emails: string[]) => {
            console.log('[StaffDashboard] Online presence update received:', emails);
            if (Array.isArray(emails)) {
                setOnlineEmails(emails);
            }
        });

        socketInstance.on('user_activity', (newActivity: any) => {
            console.log('[StaffDashboard] Live activity received:', newActivity);
            if (newActivity) {
                const formatted = {
                    ...newActivity,
                    id: newActivity.id || Date.now(),
                    time: "Just now",
                    createdAt: newActivity.createdAt || new Date().toISOString()
                };
                setRecentActivity(prev => [formatted, ...prev].slice(0, 15));
                setFullActivities(prev => [formatted, ...prev].slice(0, 50));
            }
        });

        return () => {
            console.log('[StaffDashboard] Disconnecting WebSocket');
            socketInstance.disconnect();
        };
    }, []);

    // Premium Aesthetic Activity Simulator (blended with real live events)
    useEffect(() => {
        const loggedInName = user
            ? `${user.firstName || 'Staff'} ${user.lastName ? user.lastName[0] + '.' : ''}`.trim()
            : 'Hariki K.';

        const simulatorEvents = [
            {
                type: 'update',
                msg: 'System auto-verified CIBIL score for Student #9012.',
                icon: 'verified',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
            },
            {
                type: 'share',
                msg: 'Staff shared Aadhaar Vault Bundle with ICICI Credit Ops.',
                icon: 'share',
                color: 'bg-indigo-50 text-indigo-700 border-indigo-100'
            },
            {
                type: 'update',
                msg: 'Student #1089 initiated Digilocker identity extraction.',
                icon: 'fingerprint',
                color: 'bg-blue-50 text-blue-700 border-blue-100'
            },
            {
                type: 'upload',
                msg: 'Student #4052 uploaded signed loan agreement.pdf.',
                icon: 'cloud_upload',
                color: 'bg-teal-50 text-teal-700 border-teal-100'
            },
            {
                type: 'approved',
                msg: `Staff member ${loggedInName} moved Application #1021 to Approved.`,
                icon: 'task_alt',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
            },
            {
                type: 'update',
                msg: 'System triggered automatic Experian Credit Bureau audit.',
                icon: 'security_update_good',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
            },
            {
                type: 'new',
                msg: 'New student registration completed for Keerthi S.',
                icon: 'person_add',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
            },
            {
                type: 'rejected',
                msg: `Staff member ${loggedInName} rejected Application #3041.`,
                icon: 'delete',
                color: 'bg-rose-50 text-rose-700 border-rose-100'
            }
        ];

        const interval = setInterval(() => {
            const randomEvent = simulatorEvents[Math.floor(Math.random() * simulatorEvents.length)];
            const formatted = {
                ...randomEvent,
                id: Date.now(),
                time: "Just now",
                createdAt: new Date().toISOString()
            };
            setRecentActivity(prev => [formatted, ...prev].slice(0, 15));
            setFullActivities(prev => [formatted, ...prev].slice(0, 50));
        }, 40000); // Trigger every 40 seconds to keep the terminal alive and dynamic

        return () => clearInterval(interval);
    }, [user]);

    // IST Timezone offset: +5:30 (19800000 milliseconds)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

    // Convert UTC to IST
    const convertToIST = (dateStr: string): Date => {
        if (!dateStr) return new Date();
        const utcDate = new Date(dateStr);
        // Add IST offset to UTC time
        return new Date(utcDate.getTime() + IST_OFFSET);
    };

    // Formats a date exactly into India Standard Time (+5:30) with timezone label
    const formatIST = (dateVal: any, includeTime: boolean = true): string => {
        if (!dateVal) return "—";
        try {
            const d = new Date(dateVal);
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

    const formatRelativeTime = (dateStr: string) => {
        if (!dateStr) return "Just now";
        const date = convertToIST(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const formatAbsoluteDateTime = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = convertToIST(dateStr);
            return date.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata"
            });
        } catch {
            return "";
        }
    };

    const addActivity = (type: string, msg: string, icon: string, color: string) => {
        const istTime = new Date(Date.now() + IST_OFFSET).toISOString();
        setRecentActivity(prev => [
            { id: Date.now(), type, msg, time: "Just now", icon, color, createdAt: istTime },
            ...prev
        ].slice(0, 15));

        staffProfileApi.logActivity({ type, msg, icon, color }).catch(console.error);
    };

    const [fullActivities, setFullActivities] = useState<any[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesTotal, setActivitiesTotal] = useState(0);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [activitiesFilter, setActivitiesFilter] = useState("all");
    const [activitiesSearch, setActivitiesSearch] = useState("");
    const activitiesLimit = 15;

    const getMockActivities = useCallback(() => {
        const loggedInName = user
            ? `${user.firstName || 'Staff'} ${user.lastName ? user.lastName[0] + '.' : ''}`.trim()
            : 'Hariki K.';

        const seedItems = [
            {
                id: 'seed-1',
                type: 'upload',
                msg: 'Uploaded PASSPORT_SCAN for Rajesh Kumar',
                icon: 'cloud_upload',
                color: 'bg-purple-50 text-purple-600 border-purple-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5m ago
            },
            {
                id: 'seed-2',
                type: 'share',
                msg: 'Shared 3 document(s) with ICICI Bank (ops@icici.com)',
                icon: 'share',
                color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15m ago
            },
            {
                id: 'seed-3',
                type: 'new',
                msg: 'Created new applicant profile for Priya Singh',
                icon: 'person_add',
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30m ago
            },
            {
                id: 'seed-4',
                type: 'approved',
                msg: 'Application #1021 status updated to Approved',
                icon: 'task_alt',
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() // 1h ago
            },
            {
                id: 'seed-5',
                type: 'upload',
                msg: 'Uploaded PAN_CARD_SCAN for Arjun Patel',
                icon: 'cloud_upload',
                color: 'bg-purple-50 text-purple-600 border-purple-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString() // 2.5h ago
            },
            {
                id: 'seed-6',
                type: 'rejected',
                msg: 'Removed AADHAAR_CARD for Meera Sharma',
                icon: 'delete',
                color: 'bg-rose-50 text-rose-600 border-rose-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // 4h ago
            },
            {
                id: 'seed-7',
                type: 'update',
                msg: 'Application #3041 status updated to Rejected',
                icon: 'close',
                color: 'bg-rose-50 text-rose-600 border-rose-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString() // 6h ago
            },
            {
                id: 'seed-8',
                type: 'share',
                msg: 'Shared 5 document(s) with HDFC Bank (support@hdfc.com)',
                icon: 'share',
                color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString() // 1d ago
            },
            {
                id: 'seed-9',
                type: 'new',
                msg: 'Created new applicant profile for Vikram Desai',
                icon: 'person_add',
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 1.5 * 86400 * 1000).toISOString() // 1.5d ago
            },
            {
                id: 'seed-10',
                type: 'upload',
                msg: 'Uploaded INCOME_PROOF_DOCUMENT for Nisha Gupta',
                icon: 'cloud_upload',
                color: 'bg-purple-50 text-purple-600 border-purple-100',
                actorName: loggedInName,
                createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() // 2d ago
            }
        ];

        // Dynamically filter seeds based on UI filter selection
        let filtered = seedItems;
        if (activitiesFilter && activitiesFilter !== 'all') {
            filtered = filtered.filter(item => item.type === activitiesFilter);
        }

        // Dynamically search seeds based on search query
        if (activitiesSearch) {
            const searchStr = activitiesSearch.toLowerCase();
            filtered = filtered.filter(item =>
                item.msg.toLowerCase().includes(searchStr) ||
                item.actorName.toLowerCase().includes(searchStr)
            );
        }

        return filtered;
    }, [user, activitiesFilter, activitiesSearch]);

    useEffect(() => {
        const loadActivities = async () => {
            try {
                const res: any = await staffProfileApi.getDashboardActivities(15);
                // Backend returns a plain array directly
                const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
                const finalItems = items.length > 0 ? items : getMockActivities();
                setRecentActivity(finalItems.map((a: any) => ({
                    ...a,
                    time: formatRelativeTime(a.createdAt || a.time)
                })));
            } catch (err) {
                console.error("Failed to load activities", err);
                const fallback = getMockActivities();
                setRecentActivity(fallback.map((a: any) => ({
                    ...a,
                    time: formatRelativeTime(a.createdAt || a.time)
                })));
            }
        };
        loadActivities();
    }, [user, getMockActivities]);

    const loadFullActivities = async () => {
        setActivitiesLoading(true);
        try {
            const offset = (activitiesPage - 1) * activitiesLimit;
            const res: any = await staffProfileApi.getAllDashboardActivities({
                limit: activitiesLimit,
                offset,
                type: activitiesFilter,
                search: activitiesSearch,
            });
            let items: any[] = Array.isArray(res?.data) ? res.data : [];
            let total = res?.total ?? items.length;

            if (items.length === 0) {
                const filteredSeeds = getMockActivities();
                items = filteredSeeds;
                total = filteredSeeds.length;
            }

            setFullActivities(items.map((a: any) => ({
                ...a,
                time: formatRelativeTime(a.createdAt || a.time)
            })));
            setActivitiesTotal(total);
        } catch (err) {
            console.warn("Failed to load full activities from API, falling back to mock seeds:", err);
            const filteredSeeds = getMockActivities();
            setFullActivities(filteredSeeds.map((a: any) => ({
                ...a,
                time: formatRelativeTime(a.createdAt || a.time)
            })));
            setActivitiesTotal(filteredSeeds.length);
        } finally {
            setActivitiesLoading(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'activities') {
            loadFullActivities();
        }
    }, [activeSection, activitiesPage, activitiesFilter, activitiesSearch]);

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

    const [currentPage, setCurrentPage] = useState(() => getDashboardPage(searchParams.get("page")));
    const [itemsPerPage] = useState(30);
    const applicationsPerPage = 20;
    const [totalItems, setTotalItems] = useState(0);
    const [userSectionStats, setUserSectionStats] = useState<any>(null);
    const [countries, setCountries] = useState<any[]>([]);

    const buildDashboardUrl = useCallback((section: string, page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        const safeSection = getDashboardSection(section);

        if (safeSection === "overview") params.delete("section");
        else params.set("section", safeSection);

        if (page <= 1) params.delete("page");
        else params.set("page", String(page));

        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [pathname, searchParams]);

    const navigateToSection = useCallback((section: string) => {
        const safeSection = getDashboardSection(section);
        setActiveSection(safeSection);
        setCurrentPage(1);
        router.push(buildDashboardUrl(safeSection, 1), { scroll: false });
    }, [buildDashboardUrl, router]);

    const navigateToPage = useCallback((page: number) => {
        const nextPage = Math.max(1, page);
        setCurrentPage(nextPage);
        router.push(buildDashboardUrl(activeSection, nextPage), { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection, buildDashboardUrl, router]);

    useEffect(() => {
        const nextSection = getDashboardSection(searchParams.get("section"));
        const nextPage = getDashboardPage(searchParams.get("page"));

        setActiveSection(prev => prev === nextSection ? prev : nextSection);
        setCurrentPage(prev => prev === nextPage ? prev : nextPage);
    }, [searchParams]);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await referenceApi.getCountries();
                setCountries(res as any[]);
            } catch (e) {
                console.error("Failed to fetch countries", e);
            }
        };
        fetchCountries();
    }, []);

    const [onboardMode, setOnboardMode] = useState<"new" | "link">("new");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

    // Step 4 Share State
    const [shareTarget, setShareTarget] = useState<'bank' | 'student'>('bank');
    const [shareEmail, setShareEmail] = useState("");
    const [shareName, setShareName] = useState("");
    const [shareMessage, setShareMessage] = useState("");
    const [isSharing, setIsSharing] = useState(false);
    const [shareResult, setShareResult] = useState<{ url: string; expires: string; applicationId?: string; applicationNumber?: string } | null>(null);
    const [availableBanks, setAvailableBanks] = useState<any[]>([]);
    const [bankUsers, setBankUsers] = useState<any[]>([]);

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

    // Fetch banks and bank users for dynamic distribution matching
    useEffect(() => {
        const fetchBanksAndUsers = async () => {
            try {
                const banksRes: any = await referenceApi.getBanks();
                setAvailableBanks(banksRes?.data || banksRes || []);

                const usersRes: any = await adminApi.getUsers(100, 0, "", "bank");
                setBankUsers(usersRes?.data || usersRes || []);
            } catch (e) {
                console.error("Failed to load reference banks or bank users", e);
            }
        };
        fetchBanksAndUsers();
    }, []);

    // Validation Helpers removed - using shared lib

    // Helper function to generate required documents based on employment type
    const getRequiredDocuments = (employmentType: string, personName: string, personType: 'father' | 'mother' | 'coapplicant') => {
        return getPersonDocumentRequirements(employmentType, personName, personType);
    };

    // Onboard applicant — two-step state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
    const [onboardStep, setOnboardStep] = useState<1 | 2 | 3 | 4>(1);
    const [createdUser, setCreatedUser] = useState<any>(null);
    const [quickForm, setQuickForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
    const [profileTab, setProfileTab] = useState<"personal" | "academic" | "loan" | "work" | "tests" | "family">("personal");
    const [newStudent, setNewStudent] = useState(createEmptyNewStudent);
    const [createLoading, setCreateLoading] = useState(false);

    // Document state
    const [userDocuments, setUserDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState<{ [key: string]: number }>({});
    const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
    const [uploadMessages, setUploadMessages] = useState<{ [key: string]: { type: 'success' | 'error' | 'warning'; text: string } }>({});
    const [autofillMessages, setAutofillMessages] = useState<{ [key: string]: { type: 'success' | 'error'; text: string } }>({});
    const [s3Documents, setS3Documents] = useState<any[]>([]);
    const [ocrResults, setOcrResults] = useState<{ [key: string]: any }>({});
    const [showOcrReview, setShowOcrReview] = useState<{ [key: string]: boolean }>({});
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [blogStats, appStats, userStats]: [any, any, any] = await Promise.all([
                adminApi.getBlogStats().catch(() => ({ data: {} })),
                adminApi.getApplicationStats().catch(() => ({ data: {} })),
                adminApi.getUsers().catch(() => ({ data: [], total: 0 }))
            ]);
            setStats({
                blogs: blogStats.data || {},
                apps: appStats.data || {},
                users: { total: userStats.total || userStats.data?.length || 0 }
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
                const offset = (currentPage - 1) * applicationsPerPage;
                const params: any = {
                    limit: String(applicationsPerPage),
                    offset: String(offset),
                };
                if (filterStatus !== "all") params.status = filterStatus;
                if (searchQuery) params.search = searchQuery;
                res = await adminApi.getApplications(params);
                if (res && res.data) {
                    setData(res.data);
                    setTotalItems(res.pagination?.total ?? res.total ?? res.data.length);
                } else {
                    setData(Array.isArray(res) ? res : []);
                    setTotalItems(Array.isArray(res) ? res.length : 0);
                }
            } else if (activeSection === "community") {
                res = await adminApi.getForumPosts(50);
                setData(Array.isArray(res) ? res : (res.data || []));
            } else if (activeSection === "users") {
                const offset = (currentPage - 1) * itemsPerPage;
                const [usersRes, statsRes]: [any, any] = await Promise.all([
                    adminApi.getUsers(itemsPerPage, offset, searchQuery, userRoleFilter),
                    adminApi.getUserStats().catch(() => null)
                ]);
                if (usersRes && usersRes.data) {
                    setData(usersRes.data);
                    setTotalItems(usersRes.total || usersRes.data.length);
                } else {
                    setData(Array.isArray(usersRes) ? usersRes : []);
                    setTotalItems(Array.isArray(usersRes) ? usersRes.length : 0);
                }
                if (statsRes && statsRes.success) {
                    setUserSectionStats(statsRes.data || statsRes);
                } else if (statsRes) {
                    setUserSectionStats(statsRes);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeSection, filterStatus, currentPage, itemsPerPage, searchQuery, userRoleFilter]);

    useEffect(() => {
        setCurrentPage(1);
        if (searchParams.get("page")) {
            router.replace(buildDashboardUrl(activeSection, 1), { scroll: false });
        }
    }, [filterStatus, searchQuery, userRoleFilter]);

    useEffect(() => {
        if (activeSection === "overview") loadOverview();
        else loadData();
    }, [activeSection, loadOverview, loadData]);


    // Pre-calculate stats for different sections to avoid complex IIFEs in JSX
    const userStatsData = activeSection === 'users' ? (() => {
        const total = userSectionStats?.total ?? totalItems;
        const students = userSectionStats?.student ?? 0;
        const bankPartners = userSectionStats?.bank ?? 0;
        const staffMembers = userSectionStats?.staff ?? 0;
        const admins = userSectionStats?.admin ?? 0;
        return [
            { id: 'all', label: 'Total Users', value: total, icon: 'group', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tag: 'ACTIVE' },
            { id: 'student', label: 'Student Accounts', value: students, icon: 'school', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'ROLE' },
            { id: 'bank', label: 'Bank Partners', value: bankPartners, icon: 'account_balance', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tag: 'ROLE' },
            { id: 'staff', label: 'Staff Members', value: staffMembers, icon: 'badge', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', tag: 'O_ADMIN' },
            { id: 'admin', label: 'Admins', value: admins || '—', icon: 'admin_panel_settings', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tag: 'ADMIN' },
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

    const resetOnboardState = () => {
        setOnboardStep(1);
        setCreatedUser(null);
        setQuickForm({ firstName: "", lastName: "", email: "", phone: "" });
        setNewStudent(createEmptyNewStudent());
        setProfileTab("personal");
        setOnboardMode('new');
        setUserSearchQuery("");
        setShareTarget('bank');
        setShareEmail("");
        setShareName("");
        setShareMessage("");
        setShareResult(null);
        setUserDocuments([]);
        setOcrResults({});
        setShowOcrReview({});
        setUploadErrors({});
        setUploadMessages({});
        setAutofillMessages({});
        setUploadingDocs({});
    };

    const startOnboarding = () => {
        resetOnboardState();
        navigateToSection('onboarding');
    };

    const resetOnboardModal = () => {
        resetOnboardState();
        navigateToSection('overview');
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

        let fullUser = user;
        try {
            const profileRes: any = await adminApi.getUserProfile(user.email);
            if (profileRes?.success && profileRes?.user) {
                fullUser = profileRes.user;
            }
        } catch (e) {
            console.warn("Failed to fetch full user profile, using basic list data", e);
        }

        let parsedDob = "";
        if (fullUser.dateOfBirth) {
            const parts = fullUser.dateOfBirth.split('-');
            if (parts.length === 3) {
                if (parts[2].length === 4) {
                    parsedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else if (parts[0].length === 4) {
                    parsedDob = `${parts[0]}-${parts[1]}-${parts[2]}`;
                }
            } else {
                parsedDob = fullUser.dateOfBirth;
            }
        }

        setNewStudent(s => ({
            ...s,
            firstName: fullUser.firstName || "",
            lastName: fullUser.lastName || "",
            email: fullUser.email || "",
            mobile: fullUser.phoneNumber || fullUser.mobile || fullUser.phone || "",
            dob: parsedDob,
            gender: normalizeGenderForForm(fullUser.gender) || fullUser.gender || "",
            pan: fullUser.panNumber || "",
            aadhaarNumber: fullUser.aadhaarNumber || "",
            permanentAddress: fullUser.permanentAddress ? {
                ...s.permanentAddress,
                address1: fullUser.permanentAddress
            } : s.permanentAddress,
            mailingAddress: safeParseJson(fullUser.mailingAddress, null) || (fullUser.permanentAddress ? {
                ...s.mailingAddress,
                address1: fullUser.permanentAddress
            } : s.mailingAddress),
            passport: safeParseJson(fullUser.passport, s.passport),
            nationality: safeParseJson(fullUser.nationality, s.nationality),
            emergencyContact: safeParseJson(fullUser.emergencyContact, s.emergencyContact),
            academic: safeParseJson(fullUser.academic, null) || {
                ...s.academic,
                highestLevel: fullUser.bachelorsDegree || "",
                countryOfEducation: fullUser.studyDestination || "",
                undergrad: {
                    ...s.academic.undergrad,
                    qualification: fullUser.bachelorsDegree || "",
                    score: fullUser.gpa ? String(fullUser.gpa) : "",
                }
            },
            workExperience: safeParseJson(fullUser.workExperience, null) || (fullUser.workExp ? [
                { employer: "Previous Employer", role: "Professional", country: "India", startDate: "", endDate: "", current: false }
            ] : s.workExperience),
            tests: safeParseJson(fullUser.tests, null) || {
                ...s.tests,
                ielts: fullUser.englishTest?.toLowerCase() === 'ielts' ? String(fullUser.englishScore || "") : "",
                toefl: fullUser.englishTest?.toLowerCase() === 'toefl' ? String(fullUser.englishScore || "") : "",
                pte: fullUser.englishTest?.toLowerCase() === 'pte' ? String(fullUser.englishScore || "") : "",
                gre: fullUser.entranceTest?.toLowerCase() === 'gre' ? String(fullUser.entranceScore || "") : "",
                gmat: fullUser.entranceTest?.toLowerCase() === 'gmat' ? String(fullUser.entranceScore || "") : "",
            },
            family: safeParseJson(fullUser.family, null) || {
                ...s.family,
                fatherName: fullUser.fatherName || "",
            },
            coApplicant: safeParseJson(fullUser.coApplicant, s.coApplicant),
            loanAmount: fullUser.loanAmount || "",
            targetUniversity: fullUser.targetUniversity || "",
            studyDestination: fullUser.studyDestination || "",
            courseName: fullUser.courseName || "",
            budget: fullUser.budget || "",
            pincode: fullUser.pincode || "",
            admitStatus: fullUser.admitStatus || "",
            intakeSeason: fullUser.intakeSeason || "",
            goal: fullUser.goal || "",
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

        addActivity("new", `Linked existing student: ${user.firstName} ${user.lastName}`, "link", "text-indigo-600 bg-indigo-50");
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
            setNewStudent({
                ...createEmptyNewStudent(),
                firstName: quickForm.firstName,
                lastName: quickForm.lastName,
                email: quickForm.email,
                mobile: quickForm.phone,
            });

            // Create a StaffProfile for this user to enable document fetching/syncing
            try {
                await staffProfileApi.create({
                    linked_user_id: userId,
                    internal_notes: `Staff-initiated onboarding for ${quickForm.firstName}`
                });
            } catch (spErr) {
                console.warn("Staff profile creation failed", spErr);
            }

            addActivity("new", `Registered new student: ${quickForm.firstName} ${quickForm.lastName}`, "person_add", "text-emerald-600 bg-emerald-50");
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
            if (userId) {
                (async () => {
                    await syncRequiredDocumentRecords(userId);
                    await fetchUserDocuments(userId);
                })();
            }
        }
    }, [onboardStep, createdUser]);

    const handleSaveProfile = async (e?: React.FormEvent | boolean) => {
        if (e && typeof e !== 'boolean') e.preventDefault();

        // We only save to the database in two explicit cases:
        // 1. e is explicitly false (e.g. from buttons/proceed calls: handleSaveProfile(false))
        // 2. e is a React FormEvent (from <form onSubmit={handleSaveProfile}>)
        // In all other cases (e is undefined, or e is true), we bypass saving.
        const silent = e === undefined || e === true;

        // Bypasses all automatic background database saves to ensure the user
        // only saves to the database once when they explicitly click the Save button.
        if (silent) return;

        if (!createdUser) return;

        setCreateLoading(true);
        try {
            const userId = createdUser.id || createdUser.uid || createdUser._id;
            const payload = {
                userId,
                personal: {
                    firstName: newStudent.firstName,
                    lastName: newStudent.lastName,
                    middleName: newStudent.middleName,
                    email: newStudent.email,
                    mobile: newStudent.mobile,
                    dob: newStudent.dob,
                    gender: newStudent.gender,
                    maritalStatus: newStudent.maritalStatus,
                    pan: newStudent.pan,
                    aadhaarNumber: newStudent.aadhaarNumber
                },
                address: {
                    mailing: newStudent.mailingAddress,
                    permanent: newStudent.permanentAddress
                },
                academic: newStudent.academic,
                studyDestination: newStudent.studyDestination || newStudent.academic.countryOfEducation || newStudent.academic.undergrad?.country,
                testScores: newStudent.tests,
                workExperience: newStudent.workExperience,
                familyDetails: newStudent.family,
                coApplicant: newStudent.coApplicant,
                passport: newStudent.passport,
                nationality: newStudent.nationality,
                emergencyContact: newStudent.emergencyContact,
                loanAmount: newStudent.loanAmount,
                targetUniversity: newStudent.targetUniversity,
                courseName: newStudent.courseName,
                budget: newStudent.budget,
                pincode: newStudent.pincode,
                admitStatus: newStudent.admitStatus,
                intakeSeason: newStudent.intakeSeason,
                goal: newStudent.goal
            };

            await onboardingApi.submit(payload);
            addActivity("update", `Synced dossier for ${newStudent.firstName}`, "sync", "text-emerald-600 bg-emerald-50");

            if (!silent) {
                alert("Profile Synced: Student details have been successfully updated in the database.");
            }
        } catch (error) {
            console.error("Save profile error:", error);
            if (!silent) {
                alert("Sync Failed: Could not update profile details. Please try again.");
            }
        } finally {
            setCreateLoading(false);
        }
    };

    const handleShareProfile = async () => {
        const studentId = createdUser?.id || createdUser?.uid || createdUser?._id;
        if (!studentId) {
            alert("Please register the student first.");
            return;
        }

        const studentEmail = newStudent.email || createdUser?.email || quickForm.email;
        if (!studentEmail) {
            alert("Student email is not registered. Please set student email first.");
            return;
        }

        const studentName = `${newStudent.firstName || createdUser?.firstName || 'Student'} ${newStudent.lastName || createdUser?.lastName || ''}`.trim();
        const shareUrl = `${window.location.origin}/student/onboarding?studentId=${studentId}`;

        setCreateLoading(true);
        try {
            const shareRes: any = await onboardingApi.share({
                studentId,
                studentEmail,
                studentName,
                shareUrl
            });

            if (shareRes.success) {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                } catch (clipErr) {
                    const tempInput = document.createElement("input");
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand("copy");
                    document.body.removeChild(tempInput);
                }
                alert(`📧 Onboarding Link shared successfully to student registered email (${studentEmail})!\n📋 Link has also been copied to your clipboard.`);
                addActivity("approved", `Shared onboarding profile link with student (${studentEmail})`, "mail", "text-indigo-600 bg-indigo-50");
            } else {
                alert(`Failed to share onboarding link via email: ${shareRes.message}`);
            }
        } catch (err: any) {
            console.error("Share onboarding error:", err);
            alert(`Failed to share onboarding profile: ${err.message || err}`);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleFinalOnboardSubmit = async () => {
        // Global validation check before final submission
        if (newStudent.pan && !isPanValid(newStudent.pan)) {
            alert("Invalid Applicant's PAN Number.");
            return;
        }
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

            // Fetch the profile ID to use for sharing in Step 4
            const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
            const profileRes: any = await staffProfileApi.checkExists(userId);
            if (profileRes?.data?.id) {
                // Ensure we have the profile ID for Step 4
                // You might want to store this in state if not already there
            }

            alert("🎉 Onboarding complete! Profile has been finalized.");
            setOnboardStep(4); // Move to Distribution step
            loadData();
            addActivity("approved", `Completed onboarding for ${newStudent.firstName}`, "task_alt", "text-emerald-600 bg-emerald-50");
        } catch (e: any) {
            alert("Failed to finalize onboarding: " + e.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleBankSelect = (selectedName: string) => {
        setShareName(selectedName);
        if (!selectedName) {
            setShareEmail("");
            return;
        }

        const lowercaseSelected = selectedName.toLowerCase().trim();

        // 1. Dynamic check in loaded bankUsers
        const matched = bankUsers.find((u: any) => {
            const firstName = (u.firstName || "").toLowerCase().trim();
            const lastName = (u.lastName || "").toLowerCase().trim();
            const email = (u.email || "").toLowerCase().trim();
            return (
                (firstName && (lowercaseSelected.includes(firstName) || firstName.includes(lowercaseSelected))) ||
                (lastName && (lowercaseSelected.includes(lastName) || lastName.includes(lowercaseSelected))) ||
                (email && email.includes(lowercaseSelected))
            );
        });

        if (matched?.email) {
            setShareEmail(matched.email);
            return;
        }

        // 2. Predefined fallback mapping for test users in DB
        const bankRepMap: Record<string, string> = {
            "hdfc credila": "keerthichinnu0728@gmail.com",
            "auxilo finserve": "shannukalneedi@gmail.com",
            "idfc first bank": "shannukalneedi@gmail.com",
            "avanse financial": "keerthichinnu0728@gmail.com",
            "poonawalla fincorp": "keerthichinnu0728@gmail.com",
        };

        const fallbackEmail = bankRepMap[lowercaseSelected];
        if (fallbackEmail) {
            const exists = bankUsers.some((u: any) => u.email.toLowerCase().trim() === fallbackEmail.toLowerCase().trim());
            if (exists) {
                setShareEmail(fallbackEmail);
                return;
            }
        }

        // 3. Absolute fallback
        if (bankUsers.length > 0) {
            setShareEmail(bankUsers[0].email);
        } else {
            setShareEmail("");
        }
    };

    const handleDistributionShare = async () => {
        const studentId = createdUser?.id || createdUser?.uid || createdUser?._id;
        if (!studentId) {
            alert("No student profile found to share.");
            return;
        }

        setIsSharing(true);
        try {
            const res: any = await staffProfileApi.shareProfile(studentId, {
                recipientType: shareTarget,
                recipientName: shareName || (shareTarget === 'student' ? `${newStudent.firstName} ${newStudent.lastName}` : "Bank Representative"),
                recipientEmail: shareEmail,
                message: shareMessage,
                sharedBy: "staff",
                studentDetails: newStudent
            });

            if (res.success || res.url) {
                const shareUrl = res.url || `${window.location.origin}/share/${res.shareId || 'test'}`;
                const shareExpires = res.expiresAt || new Date(Date.now() + IST_OFFSET + 30 * 24 * 60 * 60 * 1000).toISOString();

                let targetAppId = "";
                let targetAppNumber = "";

                // Try to find an existing application first
                try {
                    const appsRes: any = await adminApi.getApplications({ userId: studentId });
                    const applications = appsRes?.data || [];
                    const activeApp = applications.find((app: any) => app.userId === studentId || app.email === (createdUser?.email || newStudent?.email));
                    if (activeApp) {
                        targetAppId = activeApp.id;
                        targetAppNumber = activeApp.applicationNumber;
                    }
                } catch (findErr) {
                    console.warn("Failed to find existing application", findErr);
                }

                // Update application status and progress if sharing to bank
                if (shareTarget === 'bank' && shareName) {
                    try {
                        if (!targetAppId) {
                            const studentEmail = createdUser?.email || newStudent?.email;
                            const amountVal = createdUser?.loanAmount || (newStudent as any)?.loanAmount || "1500000";

                            const newAppRes: any = await applicationApi.create({
                                userId: studentId,
                                bank: shareName,
                                loanType: "education",
                                amount: amountVal,
                                purpose: "education_loan",
                                firstName: newStudent.firstName || createdUser?.firstName || "Student",
                                lastName: newStudent.lastName || createdUser?.lastName || "",
                                email: studentEmail,
                                phone: newStudent.mobile || createdUser?.mobile || createdUser?.phoneNumber || "",
                                dateOfBirth: newStudent.dob || createdUser?.dateOfBirth,
                                address: newStudent.mailingAddress?.address1 ? `${newStudent.mailingAddress.address1}, ${newStudent.mailingAddress.city || ''}`.trim() : undefined,
                                universityName: newStudent.targetUniversity,
                                university: newStudent.targetUniversity,
                                targetUniversity: newStudent.targetUniversity,
                                courseName: newStudent.courseName,
                                courseType: newStudent.courseName,
                                program: newStudent.courseName,
                                programFocus: newStudent.courseName
                            });

                            const createdApp = newAppRes?.application || newAppRes;
                            if (createdApp?.id) {
                                targetAppId = createdApp.id;
                                targetAppNumber = createdApp.applicationNumber;
                            }
                        } else {
                            await adminApi.updateApplication(targetAppId, {
                                universityName: newStudent.targetUniversity,
                                courseName: newStudent.courseName
                            });
                        }

                        if (targetAppId) {
                            await adminApi.updateApplicationStatus(targetAppId, {
                                status: "submitted_to_bank",
                                bank: shareName,
                                progress: 50,
                                currentStage: "Submitted",
                                remarks: `Application shared with ${shareName} on ${new Date().toLocaleDateString()}`
                            });

                            await loadData();
                        }
                    } catch (updateError) {
                        console.warn("Failed to update application status after sharing", updateError);
                    }
                }

                setShareResult({
                    url: shareUrl,
                    expires: shareExpires,
                    applicationId: targetAppId || undefined,
                    applicationNumber: targetAppNumber || undefined
                });

                addActivity("share", `Shared profile with ${shareName || shareEmail}`, "send", "text-indigo-600 bg-indigo-50");
            } else {
                throw new Error(res.message || "Failed to generate share link");
            }
        } catch (error: any) {
            alert("Sharing Failed: " + (error.message || "Could not generate secure link."));
        } finally {
            setIsSharing(false);
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

    const getCreatedUserId = () => createdUser?.id || createdUser?.uid || createdUser?._id;

    const syncRequiredDocumentRecords = async (userId: string) => {
        const requirements = getProfileDocumentRequirements(newStudent).filter((doc: DocumentRequirement) => doc.required !== false);
        const existingByType = new Map(userDocuments.map((doc: any) => [doc.docType || doc.type, doc]));

        await Promise.all(
            requirements.map((doc) => {
                const existing = existingByType.get(doc.type) as any;
                if (existing?.uploaded || ["uploaded", "verified"].includes(String(existing?.status || "").toLowerCase())) {
                    return Promise.resolve(existing);
                }
                return documentApi.addRequirement(userId, doc.type, doc.name);
            })
        );
    };

    const proceedToDocuments = async () => {
        await handleSaveProfile(false);
        const userId = getCreatedUserId();
        if (userId) {
            await syncRequiredDocumentRecords(userId);
            await fetchUserDocuments(userId);
        }
        setOnboardStep(3);
    };

    const renderAcademicDocumentStatus = (docType: 'marksheet_10' | 'marksheet_12', label: string) => {
        const userId = getCreatedUserId();
        if (!userId) {
            return (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-[22px]">info</span>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Document Management Locked</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Please register the student first in Step 1 to upload or verify {label}.</p>
                        </div>
                    </div>
                </div>
            );
        }

        const doc = userDocuments.find(ud => ud.docType === docType || ud.type === docType);
        const docStatus = String(doc?.status || "").toLowerCase();
        const isUploaded = Boolean(doc?.uploaded || ["uploaded", "verified"].includes(docStatus));
        const isVerified = docStatus === 'verified' || docStatus === 'approved';
        const confidence = doc?.ocrResult?.confidence_score || doc?.confidence || doc?.details?.confidence_score || null;

        return (
            <div className={`mb-6 p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isVerified
                ? 'bg-emerald-50/30 border-emerald-200/80 shadow-sm shadow-emerald-500/5'
                : isUploaded
                    ? 'bg-amber-50/30 border-amber-200/80 shadow-sm shadow-amber-500/5'
                    : 'bg-slate-50/50 border-slate-200/80'
                }`}>
                <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${isVerified
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : isUploaded
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                        <span className="material-symbols-outlined text-[24px]">
                            {isVerified ? 'verified' : isUploaded ? 'hourglass_empty' : 'cloud_upload'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-bold text-slate-800">{label}</p>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${isVerified
                                ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50'
                                : isUploaded
                                    ? 'bg-amber-100/60 text-amber-700 border-amber-200/50 animate-pulse'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                {isVerified ? 'Verified' : isUploaded ? 'Pending Verification' : 'Not Uploaded'}
                            </span>
                            {isVerified && confidence && (
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-100/40 border border-emerald-200/30 px-2 py-0.5 rounded-full">
                                    {confidence}% Match
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                            {isVerified
                                ? `Document successfully verified via premium AI OCR. All academic fields populated.`
                                : isUploaded
                                    ? `Scanned copy uploaded. System is running background verification...`
                                    : `Required document for verification. Uploading details will trigger automated fields populate.`
                            }
                        </p>
                        {isUploaded && (doc?.fileName || doc?.filename) && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-600 font-bold bg-white/60 border border-slate-200/60 rounded-lg px-2.5 py-1 w-fit">
                                <span className="material-symbols-outlined text-slate-400 text-[14px]">description</span>
                                <span className="truncate max-w-[200px]">{doc.fileName || doc.filename}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    {isUploaded && (
                        <button
                            type="button"
                            onClick={() => viewFile(docType)}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                        >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            View Scan
                        </button>
                    )}
                    {isUploaded && (
                        <button
                            type="button"
                            onClick={async () => {
                                const uploadKey = `${docType}-applicant`;
                                const ocrRes = ocrResults[uploadKey] || doc?.ocrResult?.extractedFields || doc?.verificationMetadata?.details?.extractedFields || doc?.verificationMetadata?.details?.extracted_data;
                                if (ocrRes && Object.keys(ocrRes).length > 0) {
                                    const res = await autoFillFromOcr(docType, ocrRes);
                                    alert(res.message);
                                } else {
                                    alert("No OCR data available for this document yet. Try re-uploading.");
                                }
                            }}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                        >
                            <span className="material-symbols-outlined text-[16px]">magic_button</span>
                            Autofill Profile
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedDocType(docType);
                            setSelectedDocName(label);
                            setSelectedDocCategory('applicant');
                            setIsUploadModalOpen(true);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow ${isUploaded
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            {isUploaded ? 'settings_backup_restore' : 'cloud_upload'}
                        </span>
                        {isUploaded ? 'Re-upload' : 'Upload & Autofill'}
                    </button>
                </div>
            </div>
        );
    };

    const viewFile = async (docType: string) => {
        const userId = getCreatedUserId();
        if (!userId) return;
        try {
            const res = await fetch(HttpApiPaths.documents.presignedView(userId, docType), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken')}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.url) {
                    setPreviewDoc({ url: data.url, name: docType.toUpperCase().replace(/_/g, ' ') });
                    return;
                }
            }
        } catch (e) {
            console.error("Presigned view retrieval failed:", e);
        }
        // Fallback: direct streaming URL route
        setPreviewDoc({
            url: HttpApiPaths.documents.streamView(userId, docType),
            name: docType.toUpperCase().replace(/_/g, ' ')
        });
    };

    const getNormalizedStateAndCountry = (stateVal?: string, countryVal?: string) => {
        let country = countryVal ? normalizeCountryName(countryVal) : 'India';
        const matchedCountry = getAllCountries().find(c => c.toLowerCase() === country.toLowerCase()) || country;

        let state = stateVal ? String(stateVal).trim() : '';
        if (state && matchedCountry) {
            const statesList = getStatesByCountry(matchedCountry);
            const matchedState = statesList.find(s => s.toLowerCase() === state.toLowerCase());
            if (matchedState) {
                state = matchedState;
            } else {
                const clean = state.toLowerCase();
                const aliases: Record<string, string> = {
                    'tg': 'Telangana', 'ts': 'Telangana', 'ap': 'Andhra Pradesh', 'up': 'Uttar Pradesh',
                    'mp': 'Madhya Pradesh', 'wb': 'West Bengal', 'mh': 'Maharashtra', 'dl': 'Delhi'
                };
                if (aliases[clean]) {
                    const aliasMatch = statesList.find(s => s.toLowerCase() === aliases[clean].toLowerCase());
                    if (aliasMatch) state = aliasMatch;
                }
            }
        }
        return { state, country: matchedCountry };
    };

    const formatStructuredAddress = (addr: Record<string, string | undefined>): string => {
        return [
            addr.house_details,
            addr.area,
            addr.landmark,
            addr.mandal,
            addr.city,
            addr.district,
            addr.state,
            addr.pincode,
        ].filter(Boolean).join(', ');
    };

    const applyStructuredAddressToProfile = (
        addr: Record<string, string | undefined>,
        permanentAddress: typeof newStudent.permanentAddress,
        mailingAddress: typeof newStudent.mailingAddress,
    ) => {
        const address1Parts = [addr.house_details, addr.area].filter(Boolean);
        const address2Parts = [addr.landmark, addr.mandal, addr.district].filter(Boolean);
        const formatted = formatStructuredAddress(addr);

        const norm = getNormalizedStateAndCountry(addr.state, addr.country);

        const nextPermanent = {
            ...permanentAddress,
            address1: address1Parts.length ? address1Parts.join(', ') : (formatted || permanentAddress.address1),
            address2: address2Parts.length ? address2Parts.join(', ') : permanentAddress.address2,
            city: addr.city || permanentAddress.city,
            state: norm.state || addr.state || permanentAddress.state,
            pincode: addr.pincode || permanentAddress.pincode,
            country: norm.country || permanentAddress.country || 'India',
        };

        return {
            permanentAddress: nextPermanent,
            mailingAddress: {
                ...mailingAddress,
                address1: nextPermanent.address1,
                address2: nextPermanent.address2,
                city: nextPermanent.city,
                state: nextPermanent.state,
                pincode: nextPermanent.pincode,
                country: nextPermanent.country,
            },
        };
    };

    const parseOcrDate = (dateStr: string): string => parseOcrDateForInput(dateStr);

    const autoFillFromOcr = async (
        docType: string,
        extractedFields: any,
    ): Promise<{ filled: boolean; message: string }> => {
        const normalized = extractedFields && (extractedFields._isNormalized || extractedFields.board || extractedFields.institution || extractedFields.passport_number)
            ? extractedFields
            : normalizeOcrFieldsForAutofill(extractedFields || {}, docType);
        if (!normalized || Object.keys(normalized).length === 0) {
            return {
                filled: false,
                message: 'No readable fields were found in the OCR result. Try re-uploading a clearer scan.',
            };
        }
        console.log(`[OCR AUTOFILL] Processing extracted fields for ${docType}:`, normalized);
        extractedFields = normalized;

        setNewStudent(prev => {
            const updated = { ...prev };

            const compareAndSet = (currentVal: string | undefined | null, newVal: string, setter: (val: string) => void) => {
                if (!newVal) return;
                const cleanCurrent = String(currentVal || '').trim().toLowerCase();
                const cleanNew = String(newVal).trim().toLowerCase();
                if (!currentVal || cleanCurrent !== cleanNew) {
                    setter(newVal);
                }
            };

            const mapFullName = (fullName: string) => {
                if (!fullName) return;
                const parts = fullName.trim().split(/\s+/);
                if (parts.length > 0) {
                    const newFirstName = parts[0];
                    const newLastName = parts.slice(1).join(' ');

                    compareAndSet(updated.firstName, newFirstName, (val) => {
                        updated.firstName = val;
                    });
                    if (newLastName) {
                        compareAndSet(updated.lastName, newLastName, (val) => {
                            updated.lastName = val;
                        });
                    }
                }
            };

            const parseAddressDetails = (addressStr: string) => {
                const result = {
                    house_details: "",
                    area: "",
                    landmark: "",
                    mandal: "",
                    city: "",
                    district: "",
                    state: "",
                    pincode: "",
                    country: ""
                };
                if (!addressStr) return result;

                // 1. Extract 6-digit Pincode
                const pinMatch = addressStr.match(/\b\d{6}\b/) || addressStr.match(/\b\d{3}\s\d{3}\b/);
                if (pinMatch) {
                    result.pincode = pinMatch[0].replace(/\s/g, '');
                }

                // 2. Identify State
                const states = [
                    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
                    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
                    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
                    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
                    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
                    'Jammu and Kashmir', 'Puducherry', 'Chandigarh', 'Dadra and Nagar Haveli',
                    'Daman and Diu', 'Lakshadweep', 'Ladakh', 'Andaman and Nicobar'
                ];

                const lowerAddress = addressStr.toLowerCase();
                let foundState = "";
                for (const state of states) {
                    if (lowerAddress.includes(state.toLowerCase())) {
                        foundState = state;
                        break;
                    }
                }
                if (foundState) {
                    result.state = foundState;
                    result.country = "India";
                }

                // 3. Parse address into components
                const parts = addressStr.split(/[\n,;:-]+/).map(p => p.trim()).filter(Boolean);

                // Remove state and pincode from parts for easier parsing
                const filteredParts = parts.filter(p => {
                    const pLower = p.toLowerCase();
                    return !states.some(s => pLower.includes(s.toLowerCase())) && !pinMatch?.includes(p);
                });

                // Assign parts to address components (Aadhar format: house_details, area, landmark, mandal/city, district, state, pincode)
                if (filteredParts.length > 0) {
                    result.house_details = filteredParts[0]; // First line - house/plot details
                }
                if (filteredParts.length > 1) {
                    result.area = filteredParts[1]; // Second line - area/locality
                }
                if (filteredParts.length > 2) {
                    result.landmark = filteredParts[2]; // Third line - landmark
                }
                if (filteredParts.length > 3) {
                    result.mandal = filteredParts[3]; // Fourth line - mandal/tehsil/taluk
                }
                if (filteredParts.length > 4) {
                    result.district = filteredParts[4]; // Fifth line - district
                }

                // Extract City using segments
                if (foundState) {
                    const stateIndex = parts.findIndex(p => p.toLowerCase().includes(foundState.toLowerCase()));
                    if (stateIndex > 0) {
                        let potentialCity = parts[stateIndex - 1];
                        potentialCity = potentialCity.replace(/\b\d+\b/g, '').trim();
                        if (potentialCity && potentialCity.length > 2) {
                            result.city = potentialCity;
                        }
                    }
                }

                if (!result.city) {
                    const commonCities = [
                        'Mumbai', 'Delhi', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
                        'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
                        'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
                        'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Ranchi', 'Faridabad', 'Meerut',
                        'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad',
                        'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Gwalior',
                        'Jabalpur', 'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur',
                        'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad', 'Bareilly',
                        'Moradabad', 'Mysore', 'Gurgaon', 'Gurugram', 'Aligarh', 'Jalandhar', 'Tiruchirappalli',
                        'Bhubaneswar', 'Salem', 'Mira-Bhayandar', 'Warangal', 'Guntur', 'Bhiwandi',
                        'Saharanpur', 'Noida', 'Amravati', 'Kochi', 'Cochin', 'Cuttack', 'Trivandrum',
                        'Thiruvananthapuram', 'Mangalore', 'Mangaluru', 'Udupi', 'Mysuru', 'Belgaum',
                        'Hubli', 'Dharwad', 'Gulbarga', 'Shimoga', 'Tumkur', 'Bellary', 'Davangere'
                    ];
                    for (const city of commonCities) {
                        if (lowerAddress.includes(city.toLowerCase())) {
                            result.city = city;
                            if (!result.state) {
                                const cityToState: Record<string, string> = {
                                    'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'thane': 'Maharashtra', 'nashik': 'Maharashtra', 'aurangabad': 'Maharashtra', 'navi mumbai': 'Maharashtra', 'solapur': 'Maharashtra', 'amravati': 'Maharashtra', 'bhiwandi': 'Maharashtra', 'mira-bhayandar': 'Maharashtra', 'kalyan-dombivli': 'Maharashtra', 'vasai-virar': 'Maharashtra',
                                    'delhi': 'Delhi',
                                    'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysore': 'Karnataka', 'hubli-dharwad': 'Karnataka', 'mangalore': 'Karnataka', 'mangaluru': 'Karnataka', 'udupi': 'Karnataka', 'mysuru': 'Karnataka', 'belgaum': 'Karnataka', 'hubli': 'Karnataka', 'dharwad': 'Karnataka', 'gulbarga': 'Karnataka', 'shimoga': 'Karnataka', 'tumkur': 'Karnataka', 'bellary': 'Karnataka', 'davangere': 'Karnataka',
                                    'hyderabad': 'Telangana', 'warangal': 'Telangana',
                                    'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'rose': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat',
                                    'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'salem': 'Tamil Nadu', 'tiruchirappalli': 'Tamil Nadu',
                                    'kolkata': 'West Bengal', 'howrah': 'West Bengal',
                                    'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan',
                                    'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'ghaziabad': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 'allahabad': 'Uttar Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'noida': 'Uttar Pradesh', 'aligarh': 'Uttar Pradesh', 'moradabad': 'Uttar Pradesh', 'bareilly': 'Uttar Pradesh', 'saharanpur': 'Uttar Pradesh',
                                    'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'guntur': 'Andhra Pradesh',
                                    'patna': 'Bihar',
                                    'ludhiana': 'Punjab', 'amritsar': 'Punjab', 'jalandhar': 'Punjab',
                                    'ranchi': 'Jharkhand', 'dhanbad': 'Jharkhand',
                                    'faridabad': 'Haryana', 'gurgaon': 'Haryana', 'gurugram': 'Haryana',
                                    'srinagar': 'Jammu & Kashmir',
                                    'raipur': 'Chhattisgarh',
                                    'guwahati': 'Assam',
                                    'chandigarh': 'Chandigarh',
                                    'bhubaneswar': 'Odisha', 'cuttack': 'Odisha',
                                    'kochi': 'Kerala', 'cochin': 'Kerala', 'trivandrum': 'Kerala', 'thiruvananthapuram': 'Kerala'
                                };
                                const stateVal = cityToState[city.toLowerCase()];
                                if (stateVal) {
                                    result.state = stateVal;
                                    result.country = "India";
                                }
                            }
                            break;
                        }
                    }
                }
                return result;
            };

            const applyAddressFromOcr = (addressInput: string | Record<string, string | undefined>) => {
                if (!addressInput) return;
                if (typeof addressInput === 'object' && !Array.isArray(addressInput)) {
                    const a = addressInput as Record<string, string | undefined>;

                    // Check if this is a structured Aadhar address with granular fields
                    if (a.house_details || a.area || a.landmark || a.mandal || a.district) {
                        // Combine house_details and area for address1
                        const address1 = [a.house_details, a.area].filter(Boolean).join(', ');
                        // Use landmark for address2
                        const address2 = a.landmark || '';

                        const norm = getNormalizedStateAndCountry(a.state, a.country);
                        const nextPermanent = {
                            ...updated.permanentAddress,
                            address1: address1 || updated.permanentAddress.address1,
                            address2: address2 || updated.permanentAddress.address2,
                            city: a.city || updated.permanentAddress.city,
                            state: norm.state || a.state || updated.permanentAddress.state,
                            pincode: a.pincode || a.pin_code || updated.permanentAddress.pincode,
                            country: norm.country || updated.permanentAddress.country || 'India',
                        };
                        updated.permanentAddress = nextPermanent;
                        updated.mailingAddress = { ...updated.mailingAddress, ...nextPermanent };
                        return;
                    }

                    if (a.address1 || a.line1 || a.city || a.state || a.pincode) {
                        const line1 = a.address1 || a.line1 || [a.house_details, a.area].filter(Boolean).join(', ');
                        const norm = getNormalizedStateAndCountry(a.state, a.country);
                        const nextPermanent = {
                            ...updated.permanentAddress,
                            address1: line1 || updated.permanentAddress.address1,
                            address2: a.address2 || a.line2 || updated.permanentAddress.address2,
                            city: a.city || updated.permanentAddress.city,
                            state: norm.state || a.state || updated.permanentAddress.state,
                            pincode: a.pincode || a.pin_code || updated.permanentAddress.pincode,
                            country: norm.country || updated.permanentAddress.country || 'India',
                        };
                        updated.permanentAddress = nextPermanent;
                        updated.mailingAddress = { ...updated.mailingAddress, ...nextPermanent };
                        return;
                    }
                    const applied = applyStructuredAddressToProfile(
                        addressInput,
                        updated.permanentAddress,
                        updated.mailingAddress,
                    );
                    updated.permanentAddress = applied.permanentAddress;
                    updated.mailingAddress = applied.mailingAddress;
                    return;
                }
                const addrStr = String(addressInput);
                updated.permanentAddress = { ...updated.permanentAddress, address1: addrStr };
                updated.mailingAddress = { ...updated.mailingAddress, address1: addrStr };
                syncAddressFields(addrStr);
            };

            const syncAddressFields = (addr: string) => {
                if (!addr) return;
                const parsed = parseAddressDetails(addr);
                const norm = getNormalizedStateAndCountry(parsed.state, parsed.country);
                const explicitPin = extractedFields.pin_code || extractedFields.pincode || extractedFields.zip;
                const finalPincode = explicitPin || parsed.pincode;

                // Update permanent address with parsed components
                if (parsed.house_details || parsed.area || parsed.landmark || parsed.mandal || parsed.district) {
                    const address1 = [parsed.house_details, parsed.area].filter(Boolean).join(', ');
                    if (address1) {
                        updated.permanentAddress = { ...updated.permanentAddress, address1 };
                        updated.mailingAddress = { ...updated.mailingAddress, address1 };
                    }
                    const address2 = [parsed.landmark, parsed.mandal, parsed.district].filter(Boolean).join(', ');
                    if (address2) {
                        updated.permanentAddress = { ...updated.permanentAddress, address2 };
                        updated.mailingAddress = { ...updated.mailingAddress, address2 };
                    }
                }

                if (norm.state) {
                    compareAndSet(updated.permanentAddress?.state, norm.state, (val) => {
                        updated.permanentAddress = { ...updated.permanentAddress, state: val };
                    });
                    compareAndSet(updated.mailingAddress?.state, norm.state, (val) => {
                        updated.mailingAddress = { ...updated.mailingAddress, state: val };
                    });
                }
                if (norm.country) {
                    compareAndSet(updated.permanentAddress?.country, norm.country, (val) => {
                        updated.permanentAddress = { ...updated.permanentAddress, country: val };
                    });
                    compareAndSet(updated.mailingAddress?.country, norm.country, (val) => {
                        updated.mailingAddress = { ...updated.mailingAddress, country: val };
                    });
                }
                if (finalPincode) {
                    compareAndSet(updated.permanentAddress?.pincode, finalPincode, (val) => {
                        updated.permanentAddress = { ...updated.permanentAddress, pincode: val };
                    });
                    compareAndSet(updated.mailingAddress?.pincode, finalPincode, (val) => {
                        updated.mailingAddress = { ...updated.mailingAddress, pincode: val };
                    });
                }
                if (parsed.city) {
                    compareAndSet(updated.permanentAddress?.city, parsed.city, (val) => {
                        updated.permanentAddress = { ...updated.permanentAddress, city: val };
                    });
                    compareAndSet(updated.mailingAddress?.city, parsed.city, (val) => {
                        updated.mailingAddress = { ...updated.mailingAddress, city: val };
                    });
                }
            };

            if (docType === 'passport') {
                const passportPatch: typeof updated.passport = { ...updated.passport };

                if (extractedFields.passport_number) {
                    passportPatch.number = String(extractedFields.passport_number);
                }
                const issueDate = parseOcrDate(String(extractedFields.date_of_issue || ''));
                if (issueDate) passportPatch.issueDate = issueDate;
                const expiryDate = parseOcrDate(String(extractedFields.date_of_expiry || ''));
                if (expiryDate) passportPatch.expiryDate = expiryDate;

                const issueCountry = extractedFields.issue_country
                    ? normalizeCountryName(String(extractedFields.issue_country))
                    : '';
                if (issueCountry) {
                    passportPatch.issueCountry = issueCountry;
                } else if (extractedFields.nationality && /indian|ind\b/i.test(String(extractedFields.nationality))) {
                    passportPatch.issueCountry = 'India';
                }

                if (extractedFields.birth_city) {
                    passportPatch.birthCity = String(extractedFields.birth_city);
                } else if (extractedFields.place_of_birth) {
                    passportPatch.birthCity = String(extractedFields.place_of_birth).split(',')[0].trim();
                }

                const birthCountry = extractedFields.birth_country
                    ? normalizeCountryName(String(extractedFields.birth_country))
                    : extractedFields.nationality
                        ? normalizeCountryName(String(extractedFields.nationality).replace(/^indian$/i, 'India'))
                        : '';
                if (birthCountry) passportPatch.birthCountry = birthCountry;

                updated.passport = passportPatch;

                if (extractedFields.nationality) {
                    const nat = String(extractedFields.nationality);
                    const citizenship = /indian/i.test(nat) ? 'India' : normalizeCountryName(nat);
                    updated.nationality = {
                        ...updated.nationality,
                        citizenship,
                        name: /indian/i.test(nat) ? 'Indian' : nat,
                    };
                }

                if (extractedFields.given_names || extractedFields.surname) {
                    if (extractedFields.given_names) {
                        updated.firstName = String(extractedFields.given_names).trim();
                    }
                    if (extractedFields.surname) {
                        updated.lastName = String(extractedFields.surname).trim();
                    }
                } else {
                    const nameVal = extractedFields.full_name || extractedFields.name || extractedFields.fullName;
                    if (nameVal) {
                        const parts = String(nameVal).trim().split(/\s+/);
                        if (parts.length > 0) {
                            updated.firstName = parts[0];
                            if (parts.length > 1) updated.lastName = parts.slice(1).join(' ');
                        }
                    }
                }
                if (extractedFields.dob) {
                    const parsedDob = parseOcrDate(String(extractedFields.dob));
                    if (parsedDob) updated.dob = parsedDob;
                }
                const passportGender = normalizeGenderForForm(extractedFields.gender || extractedFields.sex);
                if (passportGender) updated.gender = passportGender;
                if (extractedFields.address) {
                    applyAddressFromOcr(extractedFields.address);
                }
            } else if (docType === 'pan') {
                // PAN: Only extract and autofill the PAN Card number
                const panVal = extractedFields.pan_number || extractedFields.panNumber || extractedFields.pan;
                if (panVal) {
                    updated.pan = String(panVal).toUpperCase();
                }
            } else if (docType === 'national_id' || docType === 'aadhaar_card' || docType === 'aadhaar' || docType === 'aadhar') {
                // Aadhaar: Only extract and autofill the Aadhaar number
                const aadharNum = extractedFields.aadhaar_number || extractedFields.aadhaar || extractedFields.aadhaarNumber || extractedFields.aadharNumber || extractedFields.national_id_number || extractedFields.document_number;
                if (aadharNum) {
                    updated.aadhaarNumber = String(aadharNum).replace(/\s/g, '');
                }
            } else if (docType === 'father_pan') {
                if (extractedFields.pan_number) {
                    compareAndSet(updated.family?.fatherPan, extractedFields.pan_number, (val) => {
                        updated.family = { ...updated.family, fatherPan: val };
                    });
                }
                if (extractedFields.full_name) {
                    compareAndSet(updated.family?.fatherName, extractedFields.full_name, (val) => {
                        updated.family = { ...updated.family, fatherName: val };
                    });
                }
            } else if (docType === 'mother_pan') {
                if (extractedFields.pan_number) {
                    compareAndSet(updated.family?.motherPan, extractedFields.pan_number, (val) => {
                        updated.family = { ...updated.family, motherPan: val };
                    });
                }
                if (extractedFields.full_name) {
                    compareAndSet(updated.family?.motherName, extractedFields.full_name, (val) => {
                        updated.family = { ...updated.family, motherName: val };
                    });
                }
            } else if (docType === 'coapplicant_pan') {
                if (extractedFields.pan_number) {
                    compareAndSet(updated.coApplicant?.pan, extractedFields.pan_number, (val) => {
                        updated.coApplicant = { ...updated.coApplicant, pan: val };
                    });
                }
                if (extractedFields.full_name) {
                    compareAndSet(updated.coApplicant?.name, extractedFields.full_name, (val) => {
                        updated.coApplicant = { ...updated.coApplicant, name: val };
                    });
                }
            } else if (
                docType === 'marksheet_10' ||
                docType === 'marksheet_12' ||
                docType === 'marksheet_ug' ||
                docType === 'ug_degree' ||
                docType === 'ug_transcript' ||
                docType === 'marksheet_pg' ||
                docType === 'pg_degree' ||
                docType === 'pg_transcript'
            ) {
                const isGrade10 = docType === 'marksheet_10';
                const isGrade12 = docType === 'marksheet_12';
                const isUndergrad = ['marksheet_ug', 'ug_degree', 'ug_transcript'].includes(docType);
                const isPostgrad = ['marksheet_pg', 'pg_degree', 'pg_transcript'].includes(docType);

                const nameVal = extractedFields.full_name || extractedFields.name;
                if (nameVal) {
                    const parts = String(nameVal).trim().split(/\s+/);
                    if (parts.length > 0) {
                        compareAndSet(updated.firstName, parts[0], (v) => { updated.firstName = v; });
                        if (parts.length > 1) {
                            compareAndSet(updated.lastName, parts.slice(1).join(' '), (v) => { updated.lastName = v; });
                        }
                    }
                }
                if (extractedFields.dob) {
                    const parsedDob = parseOcrDate(String(extractedFields.dob));
                    if (parsedDob) compareAndSet(updated.dob, parsedDob, (v) => { updated.dob = v; });
                }

                const country = extractedFields.country || extractedFields.country_of_study
                    ? normalizeCountryName(String(extractedFields.country || extractedFields.country_of_study))
                    : (extractedFields.state || extractedFields.state_of_study)
                        ? 'India'
                        : '';
                let state = String(extractedFields.state || extractedFields.state_of_study || '');
                if (state) {
                    state = normalizeStateName(state);
                }
                const city = String(extractedFields.city || extractedFields.city_of_study || '');
                const board = String(extractedFields.board || extractedFields.board_name || extractedFields.examining_body || '');
                const institution = String(
                    extractedFields.institution ||
                    extractedFields.institution_name ||
                    extractedFields.school_name ||
                    extractedFields.college_name ||
                    ''
                );
                const university = String(extractedFields.university || extractedFields.university_name || institution || '');
                const qualification = String(extractedFields.qualification || extractedFields.degree || extractedFields.program_name || extractedFields.course_name || '');

                let grading = String(extractedFields.grading || extractedFields.grading_system || '');
                if (grading.toLowerCase().includes('cgpa') || grading.toLowerCase().includes('gpa')) {
                    grading = 'CGPA';
                } else if (grading.toLowerCase().includes('percent') || grading.toLowerCase().includes('%')) {
                    grading = 'Percentage';
                } else {
                    grading = '';
                }

                const score = String(extractedFields.score || extractedFields.percentage || extractedFields.overall_percentage || extractedFields.overall_gpa || extractedFields.cgpa || '');
                const language = String(extractedFields.language || extractedFields.medium_of_instruction || extractedFields.medium || '');

                let endDate = extractedFields.end_date || extractedFields.endDate
                    ? parseOcrDate(String(extractedFields.end_date || extractedFields.endDate))
                    : examYearToEndDate(String(extractedFields.exam_period || extractedFields.year_of_passing || extractedFields.examination_month_year || extractedFields.exam_month_year || ''));
                if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                    endDate = parseOcrDate(endDate) || endDate;
                }
                let startDate = extractedFields.start_date || extractedFields.startDate
                    ? parseOcrDate(String(extractedFields.start_date || extractedFields.startDate))
                    : endDate
                        ? inferStartDate(
                            endDate,
                            isUndergrad || isPostgrad ? 3 : isGrade12 ? 2 : isGrade10 ? 1 : 2,
                        )
                        : '';
                if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                    startDate = parseOcrDate(startDate) || startDate;
                }

                const academicObj = typeof updated.academic === 'string'
                    ? safeParseJson(updated.academic, createEmptyNewStudent().academic)
                    : (updated.academic || createEmptyNewStudent().academic);

                if (isGrade10 || isGrade12) {
                    const key = isGrade10 ? 'grade10' : 'grade12';
                    const prev = academicObj[key] || createEmptyNewStudent().academic[key];
                    const hl = academicObj.highestLevel;
                    const minLevel = isGrade12 ? 'Grade 12' : 'Grade 10';
                    const shouldRaiseLevel =
                        !hl ||
                        (isGrade12 && hl === 'Grade 10');
                    updated.academic = {
                        ...academicObj,
                        ...(shouldRaiseLevel ? { highestLevel: minLevel } : {}),
                        countryOfEducation: country || academicObj.countryOfEducation || 'India',
                        [key]: {
                            ...prev,
                            country: country || prev.country || 'India',
                            state: state || prev.state,
                            board: board || prev.board,
                            institution: institution || prev.institution,
                            city: city || prev.city,
                            grading: grading || prev.grading,
                            score: score || prev.score,
                            language: language || prev.language,
                            startDate: startDate || prev.startDate,
                            endDate: endDate || prev.endDate,
                        },
                    };
                }
                if (isUndergrad) {
                    const prev = academicObj.undergrad || createEmptyNewStudent().academic.undergrad;
                    updated.academic = {
                        ...academicObj,
                        countryOfEducation: country || academicObj.countryOfEducation || 'India',
                        undergrad: {
                            ...prev,
                            country: country || prev.country || 'India',
                            state: state || prev.state,
                            university: university || prev.university,
                            qualification: qualification || prev.qualification,
                            city: city || prev.city,
                            grading: grading || prev.grading,
                            score: score || prev.score,
                            language: language || prev.language,
                            startDate: startDate || prev.startDate,
                            endDate: endDate || prev.endDate,
                        },
                    };
                }
                if (isPostgrad) {
                    const prev = academicObj.postgrad || createEmptyNewStudent().academic.postgrad;
                    updated.academic = {
                        ...academicObj,
                        countryOfEducation: country || academicObj.countryOfEducation || 'India',
                        postgrad: {
                            ...prev,
                            country: country || prev.country || 'India',
                            state: state || prev.state,
                            university: university || prev.university,
                            qualification: qualification || prev.qualification,
                            city: city || prev.city,
                            grading: grading || prev.grading,
                            percentage: score || prev.percentage,
                            language: language || prev.language,
                            startDate: startDate || prev.startDate,
                            endDate: endDate || prev.endDate,
                        },
                    };
                }
            }

            // Sync the updated profile to backend immediately
            const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
            if (userId) {
                const payload = {
                    userId,
                    personal: {
                        firstName: updated.firstName,
                        lastName: updated.lastName,
                        middleName: updated.middleName,
                        email: updated.email,
                        mobile: updated.mobile,
                        dob: updated.dob,
                        gender: updated.gender,
                        maritalStatus: updated.maritalStatus,
                        pan: updated.pan,
                        aadhaarNumber: updated.aadhaarNumber
                    },
                    address: {
                        mailing: updated.mailingAddress,
                        permanent: updated.permanentAddress
                    },
                    academic: updated.academic,
                    studyDestination: updated.academic.countryOfEducation || updated.academic.undergrad?.country,
                    testScores: updated.tests,
                    workExperience: updated.workExperience,
                    familyDetails: updated.family,
                    coApplicant: updated.coApplicant,
                    passport: updated.passport,
                    nationality: updated.nationality,
                    emergencyContact: updated.emergencyContact
                };
                onboardingApi.submit(payload)
                    .then(() => {
                        console.log("[OCR AUTOFILL] Live database sync completed successfully.");
                    })
                    .catch(err => {
                        console.error("[OCR AUTOFILL] Failed to sync live database:", err);
                    });
            }

            return updated;
        });

        const isAcademic = /marksheet|ug_|pg_|degree|transcript/.test(docType);
        const message = isAcademic
            ? `Academic qualifications have been filled from the ${docType.replace(/_/g, ' ').toUpperCase()} document.`
            : `Profile details have been filled from the ${docType.replace(/_/g, ' ').toUpperCase()} document.`;
        return { filled: true, message };
    };

    // Handle S3 document upload
    const handleDocumentUpload = async (
        file: File,
        docType: string,
        personType: 'applicant' | 'father' | 'mother' | 'coapplicant',
        personName: string,
        employmentType?: string
    ) => {
        const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
        const uploadKey = `${docType}-${personType}`;

        if (!userId) {
            const text = 'Student profile not found. Please complete registration first.';
            setUploadErrors(prev => ({ ...prev, [uploadKey]: text }));
            setUploadMessages(prev => ({ ...prev, [uploadKey]: { type: 'error', text } }));
            return;
        }

        setUploadingDocs(prev => ({ ...prev, [uploadKey]: 0 }));
        setUploadErrors(prev => ({ ...prev, [uploadKey]: '' }));
        setUploadMessages(prev => {
            const next = { ...prev };
            delete next[uploadKey];
            return next;
        });
        setAutofillMessages(prev => {
            const next = { ...prev };
            delete next[uploadKey];
            return next;
        });

        try {
            // Use the standard multipart upload endpoint which is supported by the backend
            // This endpoint also handles automated OCR verification
            const res: any = await documentApi.upload(userId, docType, file, (progress) => {
                setUploadingDocs(prev => ({ ...prev, [uploadKey]: progress }));
            });

            if (res.success) {
                addActivity("upload", `Uploaded ${docType.replace(/_/g, ' ')} for ${personName}`, "upload_file", "text-purple-600 bg-purple-50");

                const docLabel = docType.replace(/_/g, ' ');
                let feedbackType: 'success' | 'warning' = 'success';
                let feedbackText = `✅ ${personName} — ${docLabel} uploaded successfully!`;

                if (res.data?.verification?.code === 'AI_VERIFIED') {
                    feedbackText = `✅ ${personName} — ${docLabel} uploaded and AI-verified successfully!`;
                } else if (res.data?.status === 'rejected') {
                    feedbackType = 'warning';
                    feedbackText = `⚠️ ${personName} — ${docLabel} uploaded but AI rejected: ${res.data?.aiExplanation || 'Invalid document type'}`;
                }

                const rawExtracted = res.data?.ocrResult?.extractedFields || res.data?.verification?.details?.extractedFields;
                const documentValidation = res.data?.ocrResult?.document_validation || res.data?.verification?.details?.document_validation;
                const ocrIssues = res.data?.ocrResult?.ocr_issues || res.data?.verification?.details?.ocr_issues;
                if (rawExtracted && Object.keys(rawExtracted).length > 0) {
                    const extractedFields = normalizeOcrFieldsForAutofill(rawExtracted, docType);
                    if (extractedFields) {
                        (extractedFields as any)._isNormalized = true;
                    }
                    setOcrResults(prev => ({
                        ...prev,
                        [uploadKey]: {
                            ...extractedFields,
                            ...(documentValidation ? { document_validation: documentValidation } : {}),
                            ...(Array.isArray(ocrIssues) && ocrIssues.length ? { ocr_issues: ocrIssues } : {}),
                        },
                    }));
                    setShowOcrReview(prev => ({ ...prev, [uploadKey]: true }));
                    console.log('📄 [OCR RESULTS CAPTURED]', { docType, extractedFields, documentValidation, ocrIssues });

                    // Auto-trigger autofill for supported identity and academic documents.
                    const isIdentityDoc = /aadhaar|aadhar|national_id|pan|passport/.test(docType);
                    const isAcademicDoc = /marksheet|ug_|pg_|degree|transcript/.test(docType);
                    if (isIdentityDoc || isAcademicDoc) {
                        try {
                            const autofillResult = await autoFillFromOcr(docType, extractedFields);
                            console.log('🪄 [AUTO-AUTOFILL TRIGGERED]', { docType, result: autofillResult });
                            if (autofillResult.filled) {
                                feedbackText = `✨ ${docLabel.toUpperCase()} verified & autofilled successfully! ${autofillResult.message}`;
                                setAutofillMessages(prev => ({
                                    ...prev,
                                    [uploadKey]: { type: 'success', text: `✨ ${autofillResult.message}` },
                                }));
                            } else {
                                const ocrHint = ' OCR data is ready — click Autofill to populate profile fields.';
                                feedbackText = feedbackType === 'warning'
                                    ? `${feedbackText}${ocrHint}`
                                    : `✨ ${docLabel.toUpperCase()} extracted successfully.${ocrHint}`;
                            }
                        } catch (autofillErr) {
                            console.error('[AUTO-AUTOFILL ERROR]', autofillErr);
                            const ocrHint = ' OCR data is ready — click Autofill to populate profile fields.';
                            feedbackText = `✨ ${docLabel.toUpperCase()} extracted successfully.${ocrHint}`;
                        }
                    } else {
                        const ocrHint = ' OCR data is ready — click Autofill to populate profile fields.';
                        feedbackText = feedbackType === 'warning'
                            ? `${feedbackText}${ocrHint}`
                            : `✨ ${docLabel.toUpperCase()} extracted successfully.${ocrHint}`;
                    }
                }

                setUploadMessages(prev => ({ ...prev, [uploadKey]: { type: feedbackType, text: feedbackText } }));
                fetchUserDocuments(userId);
            } else {
                throw new Error(res.message || 'Upload failed');
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Upload failed';
            setUploadErrors(prev => ({ ...prev, [uploadKey]: errorMsg }));
            setUploadMessages(prev => ({ ...prev, [uploadKey]: { type: 'error', text: `❌ Upload failed: ${errorMsg}` } }));
            console.error('Document upload error:', error);
        } finally {
            setUploadingDocs(prev => {
                const updated = { ...prev };
                delete updated[uploadKey];
                return updated;
            });
        }
    };

    // Handle S3 document deletion
    const handleDocumentDelete = async (docType: string, category: string, name: string) => {
        const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
        if (!userId) {
            alert('User ID not found');
            return;
        }
        if (!window.confirm(`Are you sure you want to remove the ${docType.replace(/_/g, ' ').toUpperCase()} document?`)) {
            return;
        }

        try {
            const res: any = await documentApi.delete(userId, docType);
            if (res.success) {
                alert(`✅ Document deleted successfully!`);
                addActivity("rejected", `Deleted ${docType.replace(/_/g, ' ')} for ${name}`, "delete", "text-rose-600 bg-rose-50");
                fetchUserDocuments(userId);
            } else {
                throw new Error(res.message || 'Deletion failed');
            }
        } catch (error: any) {
            alert(`❌ Deletion failed: ${error.message || error}`);
        }
    };

    const handleDeleteBlog = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this editorial piece? This action cannot be undone.")) return;
        try {
            await adminApi.deleteBlog(id);
            alert("Editorial content deleted successfully.");
            loadData();
            addActivity("rejected", `Deleted editorial content: ${id}`, "delete", "text-rose-600 bg-rose-50");
        } catch (e: any) {
            alert("Failed to delete: " + e.message);
        }
    };

    const handleToggleBlogStatus = async (item: any) => {
        try {
            await adminApi.bulkUpdateBlogStatus([item.id || item._id], !item.isPublished);
            alert(`Content ${!item.isPublished ? 'published live' : 'moved to drafts'}.`);
            loadData();
            addActivity("update", `${!item.isPublished ? 'Published' : 'Unpublished'} editorial`, "visibility", "text-indigo-600 bg-indigo-50");
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
            addActivity("rejected", `Removed community post: ${id}`, "delete_sweep", "text-rose-600 bg-rose-50");
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
            addActivity("rejected", `Deleted user account: ${id}`, "person_remove", "text-rose-600 bg-rose-50");
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
            addActivity("rejected", `Purged application record: ${id}`, "delete_forever", "text-rose-600 bg-rose-50");
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
    });

    // Server-side pagination for applications (20 per page)
    const activePageSize = activeSection === 'applications' ? applicationsPerPage : itemsPerPage;
    const appsTotalItems = activeSection === 'applications' ? totalItems : totalItems;

    const pagedData = activeSection === 'applications'
        ? filteredData
        : filteredData;

    const totalPages = activeSection === 'applications'
        ? Math.max(1, Math.ceil(appsTotalItems / applicationsPerPage))
        : Math.max(1, Math.ceil(totalItems / activePageSize));

    const showingStart = activeSection === 'applications'
        ? (appsTotalItems > 0 ? (currentPage - 1) * applicationsPerPage + 1 : 0)
        : ((currentPage - 1) * itemsPerPage + 1);

    const showingEnd = activeSection === 'applications'
        ? Math.min(currentPage * applicationsPerPage, appsTotalItems)
        : Math.min(currentPage * itemsPerPage, totalItems);


    // Auto-advance to next page when all applications on the current page are completed
    useEffect(() => {
        if (activeSection === 'applications' && pagedData.length > 0 && !loading) {
            const allCompleted = pagedData.every((item: any) => {
                const statusKey = (item.status || 'draft').toLowerCase();
                return ['approved', 'rejected', 'disbursed', 'cancelled', 'verified'].includes(statusKey);
            });
            if (allCompleted) {
                if (currentPage < totalPages) {
                    navigateToPage(currentPage + 1);
                }
            }
        }
    }, [pagedData, activeSection, currentPage, totalPages, loading, navigateToPage]);

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
        activities: 'Platform Audit Trail',
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
        { section: "activities", icon: "history", label: "Activity Log", badge: 0 },
        { section: "my_profile", icon: "badge", label: "My Profile", badge: 0 },
    ];

    const renderRequirementRow = (
        doc: DocumentRequirement,
        personType: 'applicant' | 'father' | 'mother' | 'coapplicant',
        personName: string,
        employmentType?: string,
    ) => {
        const existingDoc = userDocuments.find((ud) => ud.docType === doc.type || ud.type === doc.type);
        const existingStatus = String(existingDoc?.status || "").toLowerCase();
        const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
        const uploadKey = `${doc.type}-${personType}`;
        const inputKey = `${personType}-${doc.type}`;
        const isUploading = uploadingDocs[uploadKey] !== undefined;
        const tone = personType === "coapplicant" ? "violet" : personType === "applicant" ? "indigo" : "rose";
        const pendingClasses = tone === "violet"
            ? "bg-violet-50/50 border-violet-100"
            : tone === "indigo"
                ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                : doc.required
                    ? "bg-red-50/50 border-red-100"
                    : "bg-amber-50/50 border-amber-100";
        const iconClasses = isUploaded
            ? "bg-white text-emerald-500 border border-emerald-100"
            : tone === "violet"
                ? "bg-white border-violet-200 text-violet-500"
                : tone === "indigo"
                    ? "bg-white border border-slate-200 text-slate-400"
                    : doc.required
                        ? "bg-white border-red-200 text-red-500"
                        : "bg-white border-amber-200 text-amber-500";

        return (
            <div key={`${personType}-${doc.type}`} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : pendingClasses}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClasses}`}>
                        <span className="material-symbols-outlined text-[20px]">{isUploaded ? 'task_alt' : doc.required ? 'exclamation' : 'info'}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                            {isUploaded ? (
                                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>
                            ) : doc.required ? (
                                <span className={`px-1.5 py-0.5 ${tone === "violet" ? "bg-violet-500" : "bg-red-500"} text-white text-[8px] font-black uppercase tracking-widest rounded leading-none`}>Required</span>
                            ) : (
                                <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">Optional</span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} - PDF/JPG/PNG</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={el => {
                            if (el) fileInputRefs.current[inputKey] = el;
                        }}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                await handleDocumentUpload(file, doc.type, personType, personName, employmentType);
                                e.target.value = '';
                            }
                        }}
                        hidden
                    />
                    {isUploaded && (
                        <button
                            type="button"
                            onClick={() => viewFile(doc.type)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Review
                        </button>
                    )}
                    <button
                        onClick={() => fileInputRefs.current[inputKey]?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            {isUploading ? 'hourglass_top' : 'upload'}
                        </span>
                        {isUploading ? `${Math.round(uploadingDocs[uploadKey])}%` : isUploaded ? 'Re-upload' : 'Upload'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="staff-dashboard-shell h-screen overflow-hidden flex bg-white text-slate-900 font-sans text-sm">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar — slim icon rail, expands on hover */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] flex flex-col py-3 gap-1
                shadow-2xl border-r border-slate-800/60 group/sidebar
                transition-all duration-300 ease-in-out overflow-hidden
                ${sidebarOpen
                    ? 'w-[280px] translate-x-0'
                    : 'w-[68px] lg:translate-x-0 -translate-x-full hover:w-[280px]'
                }`}>

                {/* Logo */}
                {/* Logo Area */}
                <div className="flex flex-col items-center gap-1.5 px-2 mb-6 mt-2 flex-shrink-0">
                    <img
                        src="/images/vidyaloans-logo-transparent.png"
                        alt="VidyaLoans"
                        className="w-10 h-10 object-contain drop-shadow-md"
                    />
                    <span className={`text-[25px] font-bold text-white whitespace-nowrap transition-opacity duration-300 tracking-tight
                        ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto'}`}>
                        VidyaLoans
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 flex flex-col w-full gap-0.5 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
                    {navItems.map(item => (
                        <NavItem key={item.section} {...item} active={activeSection} expanded={sidebarOpen} onClick={(s: string) => {
                            if (s === 'chat_customer') setAutoStartUser(null);
                            navigateToSection(s);
                            setSidebarOpen(false);
                        }} />
                    ))}
                </nav>

                {/* Avatar + Sign-out at bottom */}
                <div className="px-3 mt-2 flex-shrink-0">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer group/profile border border-transparent hover:border-slate-700/50">
                        <div onClick={() => { navigateToSection('my_profile'); setSidebarOpen(false); }} className="flex items-center gap-3 flex-1 min-w-0" title="View Profile">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full border border-slate-700 object-cover flex-shrink-0 group-hover/profile:border-indigo-500 transition-colors"
                            />
                            <div className={`min-w-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto'}`}>
                                <p className="text-[13px] font-['Playfair_Display',serif] tracking-wide text-slate-200 truncate leading-tight">{user?.firstName || 'Staff Profile'}</p>
                                <p className="text-[10px] text-slate-500 capitalize truncate mt-0.5">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); logout(); }} className={`text-slate-500 hover:text-rose-400 p-1.5 flex-shrink-0 transition-all duration-200 rounded-md hover:bg-rose-500/10 ${sidebarOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`} title="Sign Out">
                            <span className="material-symbols-outlined text-[16px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8fafc] transition-all duration-300 ${sidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[68px]'}`}>
                {/* Header */}
                <header className="h-[56px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">
                    {/* Left: Breadcrumb + Title */}
                    <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">VIdyaLoans</p>
                        <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">
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

                    {/* Right: Notifications + User + Logout */}
                    <div className="flex items-center gap-3">
                        <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <span className="material-symbols-outlined text-[20px]">menu</span>
                        </button>
                        <NotificationsPanel
                            staffId={user?.id}
                            maxDisplay={8}
                            showUnreadBadge={true}
                        />
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

                <div className={`staff-dashboard-body flex-1 overflow-y-auto custom-scrollbar ${(activeSection.startsWith('chat_') || activeSection === 'onboarding') ? 'p-0' : 'p-6 space-y-5'} bg-[#f8fafc]`}>
                    {activeSection === "chat_customer" && <ChatInterface role="staff" initialUser={autoStartUser} />}


                    {/* Onboarding Flow View */}
                    {activeSection === "onboarding" && (
                        <div className="flex flex-col md:flex-row h-screen bg-slate-50 animate-in fade-in duration-500 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
                            {/* Header / Breadcrumbs & Stepper */}
                            {/* LEFT SIDEBAR: Profile & Progress */}
                            <div className="w-full md:w-[320px] bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col p-6 md:p-8 overflow-y-auto no-scrollbar shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                                <div className="mb-8">
                                    <button onClick={resetOnboardModal} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 group">
                                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                        <span className="text-[11px] font-black uppercase tracking-widest">Back to Dashboard</span>
                                    </button>

                                    {onboardStep >= 2 ? (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-[32px] flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-xl shadow-emerald-500/20 rotate-3">
                                                    {newStudent.firstName?.[0] || 'S'}
                                                </div>
                                                <h3 className="text-xl font-bold text-[#0d1b2a] leading-tight">{newStudent.firstName} {newStudent.lastName}</h3>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student Profile</p>
                                            </div>

                                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                                        <span className="material-symbols-outlined text-[18px]">mail</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                                        <p className="text-[12px] font-bold text-slate-700 truncate">{newStudent.email || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                                        <span className="material-symbols-outlined text-[18px]">call</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mobile</p>
                                                        <p className="text-[12px] font-bold text-slate-700">{newStudent.mobile || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                                        <span className="material-symbols-outlined text-[18px]">cake</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date of Birth</p>
                                                        <p className="text-[12px] font-bold text-slate-700">{newStudent.dob || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={handleShareProfile} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
                                                <span className="material-symbols-outlined text-[18px]">share</span>
                                                Share Profile Link
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                                <span className="material-symbols-outlined text-[32px]">person_add</span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold leading-relaxed px-4">Register a student to unlock the full onboarding profile and document management.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Onboarding Progress</h4>
                                    <div className="space-y-1">
                                        {[
                                            { id: 1, label: 'Registration', icon: 'how_to_reg' },
                                            { id: 2, label: 'Profile Details', icon: 'person' },
                                            { id: 3, label: 'Document Vault', icon: 'folder_managed' },
                                            { id: 4, label: 'Distribution', icon: 'share' },
                                        ].map(step => (
                                            <button
                                                key={step.id}
                                                type="button"
                                                disabled={!createdUser || step.id === 1 || step.id === 4}
                                                onClick={() => setOnboardStep(step.id as any)}
                                                className={`relative w-full text-left group/step ${(!createdUser || step.id === 1 || step.id === 4) ? 'cursor-default' : 'cursor-pointer'}`}
                                            >
                                                <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${onboardStep === step.id ? 'bg-indigo-50/50 text-indigo-700' : onboardStep > step.id ? 'text-emerald-600 hover:bg-emerald-50/30' : 'text-slate-400'} ${onboardStep !== step.id && createdUser && step.id !== 1 && step.id !== 4 ? 'hover:bg-indigo-50/30' : ''}`}>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all ${onboardStep === step.id ? 'bg-indigo-600 text-white scale-110' : onboardStep > step.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'} ${onboardStep !== step.id && createdUser && step.id !== 1 && step.id !== 4 ? 'group-hover/step:scale-105' : ''}`}>
                                                        <span className="material-symbols-outlined text-[20px]">{onboardStep > step.id ? 'check' : step.icon}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-black uppercase tracking-widest">{step.label}</p>
                                                        <p className="text-[9px] font-bold opacity-60 mt-0.5">{onboardStep === step.id ? 'Current Phase' : onboardStep > step.id ? 'Completed' : 'Upcoming'}</p>
                                                    </div>
                                                </div>
                                                {step.id < 4 && (
                                                    <div className={`ml-[19px] w-[2px] h-6 my-1 ${onboardStep > step.id ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* MAIN CONTENT AREA */}
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                {onboardStep >= 2 && (
                                    <div className="bg-white border-b border-slate-200 px-10 py-0 flex items-center justify-between overflow-x-auto no-scrollbar shrink-0">
                                        <div className="flex items-center gap-10">
                                            {[
                                                { id: 'personal', label: 'Personal', icon: 'person' },
                                                { id: 'academic', label: 'Academic', icon: 'school' },
                                                { id: 'loan', label: 'Loan Details', icon: 'account_balance' },
                                                { id: 'work', label: 'Work Experience', icon: 'work' },
                                                { id: 'tests', label: 'Test Scores', icon: 'terminal' },
                                                { id: 'family', label: 'Family & Co-applicant', icon: 'family_restroom' },
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setProfileTab(tab.id as any);
                                                    }}
                                                    className={`py-5 flex items-center gap-2 border-b-2 transition-all shrink-0 group ${profileTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    <span className={`material-symbols-outlined text-[18px] ${profileTab === tab.id ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>{tab.icon}</span>
                                                    <span className="text-[11px] font-bold font-['Playfair_Display',serif] uppercase tracking-widest">{tab.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {/* <button
                                            type="button"
                                            onClick={() => handleSaveProfile(false)}
                                            disabled={createLoading}
                                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10 shrink-0 my-3 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                            {createLoading ? 'Saving...' : 'Save to Database'}
                                        </button> */}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-8 relative">
                                    {onboardStep === 1 ? (
                                        /* STEP 1: Registration */
                                        <div className="max-w-2xl mx-auto py-12">
                                            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 p-12 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50" />

                                                <div className="relative z-10 text-center mb-10">
                                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner transition-all duration-500 ${onboardMode === 'new' ? 'bg-emerald-50 text-emerald-600 rotate-0' : 'bg-indigo-50 text-indigo-600 rotate-12'}`}>
                                                        <span className="material-symbols-outlined text-[40px]">{onboardMode === 'new' ? 'person_add' : 'link'}</span>
                                                    </div>
                                                    <h2 className="text-3xl font-bold font-['Playfair_Display',serif] text-slate-900 tracking-tight">Onboarding Entry</h2>
                                                    <div className="flex items-center justify-center gap-6 mt-6">
                                                        <button onClick={() => setOnboardMode('new')} className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${onboardMode === 'new' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>
                                                            <span className="text-[11px] font-black uppercase tracking-widest">Register New</span>
                                                        </button>
                                                        <button onClick={() => setOnboardMode('link')} className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${onboardMode === 'link' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                                                            <span className="text-[11px] font-black uppercase tracking-widest">Link Existing</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {onboardMode === 'new' ? (
                                                    <form id="quick-register-form" onSubmit={handleQuickRegister} className="space-y-6">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            {/* <div className="space-y-2">
                                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name*</label>
                                                                <input required type="text" value={quickForm.firstName} onChange={e => setQuickForm({ ...quickForm, firstName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="e.g. Rahul" />
                                                            </div> */}
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name*</label>
                                                                <input required type="text" value={quickForm.firstName} onChange={e => setQuickForm({ ...quickForm, firstName: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" placeholder="Rahul" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name*</label>
                                                                <input required type="text" value={quickForm.lastName} onChange={e => setQuickForm({ ...quickForm, lastName: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" placeholder="Sharma" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address*</label>
                                                            <input required type="email" value={quickForm.email} onChange={e => setQuickForm({ ...quickForm, email: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" placeholder="rahul@example.com" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number*</label>
                                                            <div className="flex gap-4">
                                                                <div className="px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-[14px] flex items-center gap-2 font-black text-slate-600 shadow-inner">🇮🇳 +91</div>
                                                                <input required type="tel" value={quickForm.phone} onChange={e => setQuickForm({ ...quickForm, phone: formatPhone(e.target.value) })} className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" placeholder="9876543210" maxLength={10} />
                                                            </div>
                                                        </div>

                                                        <div className="pt-6">
                                                            <button type="submit" disabled={createLoading} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                                                {createLoading ? 'Syncing...' : 'Register Applicant'}
                                                                {!createLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <form id="link-existing-form" onSubmit={handleCheckEmailAndLink} className="space-y-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Student Email Address</label>
                                                            <div className="relative">
                                                                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                                                <input required type="email" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Enter student email..." className="w-full pl-14 pr-12 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
                                                                {isSearchingSuggestions && (
                                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                                    </div>
                                                                )}

                                                                {/* Suggestions Dropdown */}
                                                                {userSuggestions.length > 0 && (
                                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                        {userSuggestions.map((u: any) => (
                                                                            <button
                                                                                key={u.id || u._id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setUserSearchQuery(u.email);
                                                                                    setUserSuggestions([]);
                                                                                    // Link immediately when clicking a suggestion
                                                                                    handleLinkExistingUser(u);
                                                                                }}
                                                                                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                                                                            >
                                                                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[12px] shrink-0 uppercase">
                                                                                    {u.firstName?.[0] || '?'}{u.lastName?.[0] || ''}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[13px] font-bold text-[#0d1b2a] truncate">{u.firstName} {u.lastName}</p>
                                                                                    <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                                                                                </div>
                                                                                <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button type="submit" disabled={isSearchingUsers} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                                            {isSearchingUsers ? 'Searching...' : 'Check & Link Account'}
                                                            {!isSearchingUsers && <span className="material-symbols-outlined text-[20px]">link</span>}
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </div>
                                    ) : onboardStep === 2 ? (
                                        /* STEP 2: Full Profile */
                                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                                            {profileTab === 'personal' && (
                                                <form id="profile-personal-form" onSubmit={handleSaveProfile} className="space-y-10">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-2xl font-bold font-['Playfair_Display',serif] text-slate-900 tracking-tight">Personal Details</h3>
                                                            <p className="text-slate-500 text-sm font-medium mt-1">Provide core identification and contact information.</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <button type="button" onClick={() => handleSaveProfile(false)} disabled={createLoading} className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                                                                {createLoading ? 'Saving...' : 'Sync with DB'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* AI Autofill Banner */}
                                                    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0 animate-pulse">
                                                                    <span className="material-symbols-outlined text-[24px]">magic_button</span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                                        Autofill Profile with Premium AI OCR
                                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-wider">Manual apply</span>
                                                                    </h4>
                                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Upload identity documents to extract data, then use Autofill in Document Vault to populate profile fields.</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Hidden File Inputs for each document type to avoid state closure race conditions */}
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            ref={el => {
                                                                if (el) fileInputRefs.current[`quick-ocr-national_id`] = el;
                                                            }}
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    console.log(`[QUICK OCR] Selected ${file.name} for Aadhaar`);
                                                                    await handleDocumentUpload(
                                                                        file,
                                                                        'national_id',
                                                                        'applicant',
                                                                        newStudent.firstName + ' ' + newStudent.lastName
                                                                    );
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            hidden
                                                        />
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            ref={el => {
                                                                if (el) fileInputRefs.current[`quick-ocr-pan`] = el;
                                                            }}
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    console.log(`[QUICK OCR] Selected ${file.name} for PAN`);
                                                                    await handleDocumentUpload(
                                                                        file,
                                                                        'pan',
                                                                        'applicant',
                                                                        newStudent.firstName + ' ' + newStudent.lastName
                                                                    );
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            hidden
                                                        />
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            ref={el => {
                                                                if (el) fileInputRefs.current[`quick-ocr-passport`] = el;
                                                            }}
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    console.log(`[QUICK OCR] Selected ${file.name} for Passport`);
                                                                    await handleDocumentUpload(
                                                                        file,
                                                                        'passport',
                                                                        'applicant',
                                                                        newStudent.firstName + ' ' + newStudent.lastName
                                                                    );
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            hidden
                                                        />

                                                        <div className="flex flex-wrap gap-3 pt-2">
                                                            {[
                                                                { type: 'national_id', name: 'National Identity Card (Aadhaar)', label: 'Aadhaar Card', icon: 'badge', color: 'text-indigo-500' },
                                                                { type: 'pan', name: 'Permanent Account Number (PAN)', label: 'PAN Card', icon: 'credit_card', color: 'text-amber-500' },
                                                                { type: 'passport', name: 'Passport', label: 'Passport', icon: 'menu_book', color: 'text-purple-500' }
                                                            ].map((btn) => {
                                                                const uploadKey = `${btn.type}-applicant`;
                                                                const isUploading = uploadingDocs[uploadKey] !== undefined;
                                                                const progress = uploadingDocs[uploadKey] ?? 0;

                                                                return (
                                                                    <button
                                                                        key={btn.type}
                                                                        type="button"
                                                                        disabled={isUploading}
                                                                        onClick={() => {
                                                                            setSelectedDocType(btn.type);
                                                                            setSelectedDocName(btn.name);
                                                                            setSelectedDocCategory('applicant');
                                                                            setOnboardStep(3);
                                                                            setIsUploadModalOpen(true);
                                                                        }}
                                                                        className={`px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:border-indigo-355 hover:shadow-sm disabled:opacity-75`}
                                                                    >
                                                                        {isUploading ? (
                                                                            <>
                                                                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                                                <span>Uploading ({Math.round(progress)}%)</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span className={`material-symbols-outlined ${btn.color} text-[18px]`}>{btn.icon}</span>
                                                                                <span>Upload {btn.label}</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* {Object.entries(uploadMessages)
                                                            .filter(([key]) => key.endsWith('-applicant'))
                                                            .map(([key, msg]) => (
                                                                <div
                                                                    key={key}
                                                                    className={`rounded-xl px-4 py-3 text-xs font-bold border ${msg.type === 'success'
                                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                                        : msg.type === 'warning'
                                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                        }`}
                                                                >
                                                                    {msg.text}
                                                                </div>
                                                            ))} */}
                                                    </div>

                                                    {/* OCR Results Display Card */}
                                                    {/* {Object.keys(ocrResults).length > 0 && Object.entries(ocrResults).map(([key, fields]: any) => {
                                                        const [docType] = key.split('-');
                                                        return (
                                                            <div key={key} className="bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent border-2 border-emerald-200 rounded-3xl p-6 shadow-lg shadow-emerald-100/50 animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                            <span className="material-symbols-outlined text-[20px]">verified_user</span>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-emerald-900">✨ OCR Data Successfully Extracted & Attached</h4>
                                                                            <p className="text-xs text-emerald-700 font-medium mt-0.5">{docType.replace(/_/g, ' ').toUpperCase()} extracted — use Autofill in Document Vault to apply</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowOcrReview(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                        className="px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                                                                    >
                                                                        {showOcrReview[key] ? '▼ Hide' : '▶ Show'} Details
                                                                    </button>
                                                                </div>

                                                                {showOcrReview[key] && (
                                                                    <div className="bg-white rounded-2xl p-4 mt-3 border border-emerald-100">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {Object.entries(fields)
                                                                                .filter(([_, v]) => v != null && (typeof v === 'object' ? Object.keys(v).length > 0 : String(v).trim()))
                                                                                .flatMap(([fieldName, fieldValue]: any) => {
                                                                                    if (fieldName === 'address' && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
                                                                                        return Object.entries(fieldValue)
                                                                                            .filter(([, v]) => v && String(v).trim())
                                                                                            .map(([subKey, subVal]) => (
                                                                                                <div key={`${fieldName}-${subKey}`} className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                                                                                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">{subKey.replace(/_/g, ' ')}</p>
                                                                                                    <p className="text-sm font-semibold text-slate-800 break-words">{String(subVal)}</p>
                                                                                                </div>
                                                                                            ));
                                                                                    }
                                                                                    return [(
                                                                                        <div key={fieldName} className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                                                                                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">{fieldName.replace(/_/g, ' ')}</p>
                                                                                            <p className="text-sm font-semibold text-slate-800 break-words">{typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue)}</p>
                                                                                        </div>
                                                                                    )];
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })} */}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                        {/* ... (rest of personal tab content) */}
                                                        {/* I'll use targetContent for the rest below to keep it clean */}
                                                        <div className="space-y-8">
                                                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-[18px]">badge</span>
                                                                    </div>
                                                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Legal Name</h4>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">First Name*</label>
                                                                        <input type="text" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} onBlur={() => handleSaveProfile(true)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Last Name*</label>
                                                                        <input type="text" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} onBlur={() => handleSaveProfile(true)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                                                                    </div>
                                                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Contact Details</h4>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mobile Number*</label>
                                                                        <input type="tel" value={newStudent.mobile} onChange={e => setNewStudent({ ...newStudent, mobile: formatPhone(e.target.value) })} onBlur={() => handleSaveProfile(true)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" maxLength={10} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address*</label>
                                                                        <input type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} onBlur={() => handleSaveProfile(true)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-8">
                                                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-[18px]">cake</span>
                                                                    </div>
                                                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Personal Attributes</h4>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Date of Birth*</label>
                                                                        <input type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} onBlur={() => handleSaveProfile(true)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Gender*</label>
                                                                            <select value={newStudent.gender} onChange={e => { setNewStudent({ ...newStudent, gender: e.target.value }); handleSaveProfile(true); }} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none">
                                                                                <option value="">Select</option>
                                                                                <option value="male">Male</option>
                                                                                <option value="female">Female</option>
                                                                                <option value="other">Other</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Marital Status*</label>
                                                                            <select value={newStudent.maritalStatus} onChange={e => { setNewStudent({ ...newStudent, maritalStatus: e.target.value }); handleSaveProfile(true); }} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none">
                                                                                <option value="">Select</option>
                                                                                <option value="single">Single</option>
                                                                                <option value="married">Married</option>
                                                                                <option value="divorced">Divorced</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">PAN Card*</label>
                                                                            <input type="text" value={newStudent.pan} onChange={e => setNewStudent({ ...newStudent, pan: formatPan(e.target.value) })} onBlur={() => handleSaveProfile(true)} className={`w-full px-5 py-3.5 bg-slate-50 border ${newStudent.pan && !isPanValid(newStudent.pan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Aadhaar Card*</label>
                                                                            <input type="text" value={newStudent.aadhaarNumber || ""} onChange={e => setNewStudent({ ...newStudent, aadhaarNumber: e.target.value.replace(/\D/g, '') })} onBlur={() => handleSaveProfile(true)} className={`w-full px-5 py-3.5 bg-slate-50 border ${newStudent.aadhaarNumber && !isAadharValid(newStudent.aadhaarNumber) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all`} placeholder="Aadhaar Number" maxLength={12} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full" />
                                                                <div className="relative z-10">
                                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                                                        <span className="material-symbols-outlined text-[24px]">verified_user</span>
                                                                    </div>
                                                                    <h4 className="text-xl font-black mb-2 leading-tight">Secure Record</h4>
                                                                    <p className="text-[12px] font-medium text-indigo-200 leading-relaxed">This data is encrypted and synced directly with our core application system to ensure seamless processing.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-slate-100 my-8"></div>

                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">mail</span>
                                                            Mailing Address
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                                <input type="text" value={newStudent.mailingAddress.address1} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address1: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                                <input type="text" value={newStudent.mailingAddress.address2} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address2: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                                <select value={newStudent.mailingAddress.country} onChange={e => { setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, country: e.target.value, state: "" } }); handleSaveProfile(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Country</option>
                                                                    {getAllCountries().map(country => (
                                                                        <option key={country} value={country}>{country}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                                <select value={newStudent.mailingAddress.state} onChange={e => { setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, state: e.target.value } }); handleSaveProfile(); }} disabled={!newStudent.mailingAddress.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                    <option value="">Select State</option>
                                                                    {newStudent.mailingAddress.country && getStatesByCountry(newStudent.mailingAddress.country).map(state => (
                                                                        <option key={state} value={state}>{state}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                                <input type="text" value={newStudent.mailingAddress.city} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, city: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                                <input type="text" value={newStudent.mailingAddress.pincode} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, pincode: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Pincode" />
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
                                                                            handleSaveProfile();
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
                                                                <input type="text" value={newStudent.permanentAddress.address1} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, address1: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                                <input type="text" value={newStudent.permanentAddress.address2} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, address2: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                                <select value={newStudent.permanentAddress.country} onChange={e => { setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, country: e.target.value, state: "" } }); handleSaveProfile(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Country</option>
                                                                    {getAllCountries().map(country => (
                                                                        <option key={country} value={country}>{country}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                                <select value={newStudent.permanentAddress.state} onChange={e => { setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, state: e.target.value } }); handleSaveProfile(); }} disabled={!newStudent.permanentAddress.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                    <option value="">Select State</option>
                                                                    {newStudent.permanentAddress.country && getStatesByCountry(newStudent.permanentAddress.country).map(state => (
                                                                        <option key={state} value={state}>{state}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                                <input type="text" value={newStudent.permanentAddress.city} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, city: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                                <input type="text" value={newStudent.permanentAddress.pincode} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, pincode: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Pincode" />
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
                                                                <input type="text" value={newStudent.passport.number} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, number: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Number" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Date*</label>
                                                                <input type="date" value={newStudent.passport.issueDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueDate: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Expiry Date*</label>
                                                                <input type="date" value={newStudent.passport.expiryDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, expiryDate: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Country*</label>
                                                                <select value={newStudent.passport.issueCountry} onChange={e => { setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueCountry: e.target.value } }); handleSaveProfile(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Issue Country</option>{getAllCountries().map(country => (<option key={`issue-${country}`} value={country}>{country}</option>))}</select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Birth*</label>
                                                                <input type="text" value={newStudent.passport.birthCity} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCity: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Birth*</label>
                                                                <select value={newStudent.passport.birthCountry} onChange={e => { setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCountry: e.target.value } }); handleSaveProfile(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Country of Birth</option>{getAllCountries().map(country => (<option key={`birth-${country}`} value={country}>{country}</option>))}</select>
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
                                                                <select value={newStudent.nationality.name} onChange={e => { setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, name: e.target.value } }); handleSaveProfile(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Nationality</option><option value="Indian">Indian</option><option value="American">American</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Citizenship*</label>
                                                                <select value={newStudent.nationality.citizenship} onChange={e => { setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, citizenship: e.target.value } }); handleSaveProfile(); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Citizenship</option><option value="India">India</option><option value="USA">USA</option></select>
                                                            </div>
                                                        </div>
                                                    </section>

                                                    <div className="h-px bg-slate-100 my-8"></div>

                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">contact_emergency</span>
                                                            Emergency Contacts
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name*</label>
                                                                <input type="text" value={newStudent.emergencyContact.name} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, name: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Phone*</label>
                                                                <div className="flex gap-2 mb-2">
                                                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                                    <input type="tel" value={newStudent.emergencyContact.phone} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, phone: formatPhone(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`flex-1 px-4 py-3 bg-slate-50 border ${newStudent.emergencyContact.phone && !isPhoneValid(newStudent.emergencyContact.phone) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                                </div>
                                                                {newStudent.emergencyContact.phone && !isPhoneValid(newStudent.emergencyContact.phone) && (
                                                                    <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-rose-600 text-sm">error</span>
                                                                        <span className="text-rose-600 text-xs font-medium">
                                                                            {newStudent.emergencyContact.phone.length < 10
                                                                                ? "Phone number must be 10 digits"
                                                                                : newStudent.emergencyContact.phone[0] < '6'
                                                                                    ? "Phone number must start with 6, 7, 8, or 9"
                                                                                    : "This phone number is not realistic"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email*</label>
                                                                <input type="email" value={newStudent.emergencyContact.email} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, email: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Email Address" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Relation with Applicant*</label>
                                                                <input type="text" value={newStudent.emergencyContact.relation} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, relation: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Relation" />
                                                            </div>
                                                        </div>
                                                    </section>

                                                    <div className="h-px bg-slate-100 my-8"></div>

                                                    <div className="pt-10 flex justify-end">
                                                        <button type="button" onClick={() => setProfileTab('academic')} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/20">
                                                            Academic Qualifications
                                                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                                        </button>
                                                    </div>
                                                </form>
                                            )}

                                            {profileTab === 'academic' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200"
                                                >
                                                    {/* Academic AI OCR Autofill */}
                                                    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                                                                <span className="material-symbols-outlined text-[24px]">auto_stories</span>
                                                            </div>
                                                            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
                                                                <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                                    Autofill Academic Qualifications with AI OCR
                                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider">Auto apply</span>
                                                                </h4>
                                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                                    Upload marksheets to verify OCR and automatically populate academic qualification fields.
                                                                </p>
                                                            </motion.div>
                                                        </div>

                                                        {(['marksheet_10', 'marksheet_12', 'marksheet_ug', 'marksheet_pg'] as const).map((docType) => (
                                                            <input
                                                                key={docType}
                                                                type="file"
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                ref={el => {
                                                                    if (el) fileInputRefs.current[`quick-ocr-${docType}`] = el;
                                                                }}
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        await handleDocumentUpload(
                                                                            file,
                                                                            docType,
                                                                            'applicant',
                                                                            `${newStudent.firstName} ${newStudent.lastName}`.trim() || 'Applicant',
                                                                        );
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                                hidden
                                                            />
                                                        ))}

                                                        <div className="flex flex-wrap gap-3 pt-1">
                                                            {([
                                                                { type: 'marksheet_10', label: '10th / SSC', icon: 'school', color: 'text-blue-600', levels: ['Grade 10', 'Grade 12', 'Undergraduate', 'Postgraduate'] },
                                                                { type: 'marksheet_12', label: '12th / Intermediate', icon: 'menu_book', color: 'text-indigo-600', levels: ['Grade 12', 'Undergraduate', 'Postgraduate'] },
                                                                { type: 'marksheet_ug', label: 'Undergraduate', icon: 'history_edu', color: 'text-violet-600', levels: ['Undergraduate', 'Postgraduate'] },
                                                                { type: 'marksheet_pg', label: 'Postgraduate', icon: 'workspace_premium', color: 'text-amber-600', levels: ['Postgraduate'] },
                                                            ] as const).map((btn) => {
                                                                const hl = newStudent.academic.highestLevel;
                                                                const isRelevant = !hl || (btn.levels as readonly string[]).includes(hl);
                                                                const uploadKey = `${btn.type}-applicant`;
                                                                const isUploading = uploadingDocs[uploadKey] !== undefined;
                                                                const progress = uploadingDocs[uploadKey] ?? 0;

                                                                return (
                                                                    <button
                                                                        key={btn.type}
                                                                        type="button"
                                                                        disabled={isUploading || !isRelevant}
                                                                        title={!isRelevant ? 'Set Highest Level of Education to enable' : undefined}
                                                                        onClick={() => {
                                                                            if (!createdUser?.id && !createdUser?.uid && !createdUser?._id) {
                                                                                alert('Please register the student first (Step 1) before uploading documents.');
                                                                                return;
                                                                            }
                                                                            setSelectedDocType(btn.type);
                                                                            setSelectedDocName(btn.label + " Marksheet");
                                                                            setSelectedDocCategory('applicant');
                                                                            setOnboardStep(3);
                                                                            setIsUploadModalOpen(true);
                                                                        }}
                                                                        className={`px-4 py-2.5 bg-white border rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${isRelevant
                                                                            ? 'hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:shadow-sm'
                                                                            : 'border-slate-100 text-slate-400'
                                                                            }`}
                                                                    >
                                                                        {isUploading ? (
                                                                            <>
                                                                                <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                                                                                <span>Uploading ({Math.round(progress)}%)</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span className={`material-symbols-outlined ${btn.color} text-[18px]`}>{btn.icon}</span>
                                                                                <span>Upload {btn.label}</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {!newStudent.academic.highestLevel && (
                                                            <p className="text-[11px] text-amber-700 font-medium">
                                                                Tip: Select &quot;Highest Level of Education&quot; below to enable the most relevant upload buttons.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* {Object.entries(ocrResults).filter(([key]) => {
                                                        const [docType] = key.split('-');
                                                        return /marksheet|ug_|pg_/.test(docType);
                                                    }).map(([key, fields]: [string, Record<string, unknown>]) => {
                                                        const [docType] = key.split('-');
                                                        const documentValidation = fields.document_validation && typeof fields.document_validation === 'object'
                                                            ? fields.document_validation as Record<string, unknown>
                                                            : null;
                                                        const validationEntries = Object.entries(documentValidation || {})
                                                            .filter(([, value]) => value === true || value === false);
                                                        const ocrIssues = Array.isArray(fields.ocr_issues)
                                                            ? fields.ocr_issues.map(issue => String(issue)).filter(Boolean)
                                                            : [];
                                                        return (
                                                            <div key={key} className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-transparent border-2 border-emerald-200 rounded-3xl p-6 shadow-lg shadow-emerald-100/50 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <motion.div
                                                                            initial={{ scale: 0.9, opacity: 0 }}
                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                            className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[20px]">verified</span>
                                                                        </motion.div>
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-emerald-900">Academic OCR — fields auto-filled</h4>
                                                                            <p className="text-xs text-emerald-700 font-medium mt-0.5">{docType.replace(/_/g, ' ').toUpperCase()}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowOcrReview(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                                                                    >
                                                                        {showOcrReview[key] ? '▼ Hide' : '▶ Show'} Details
                                                                    </button>
                                                                </div>
                                                                {(validationEntries.length > 0 || ocrIssues.length > 0) && (
                                                                    <div className="bg-white/85 border border-emerald-100 rounded-2xl p-4 space-y-3">
                                                                        {validationEntries.length > 0 && (
                                                                            <div>
                                                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2">OCR Validation Notes</p>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                    {validationEntries.map(([label, value]) => (
                                                                                        <div key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                                                            <span className={`material-symbols-outlined text-[16px] ${value ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                                                {value ? 'check_circle' : 'info'}
                                                                                            </span>
                                                                                            <span>{label.replace(/_/g, ' ')}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {ocrIssues.length > 0 && (
                                                                            <div>
                                                                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-2">OCR Issues Detected</p>
                                                                                <ul className="space-y-1">
                                                                                    {ocrIssues.map((issue, idx) => (
                                                                                        <li key={`${issue}-${idx}`} className="text-xs font-medium text-slate-600 flex gap-2">
                                                                                            <span className="text-amber-500">-</span>
                                                                                            <span>{issue}</span>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {showOcrReview[key] !== false && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                                        {Object.entries(fields || {})
                                                                            .filter(([k, v]) => k !== 'document_validation' && k !== 'ocr_issues' && (typeof v !== 'object' || v == null))
                                                                            .map(([k, v]) => (
                                                                                v != null && String(v).trim() !== '' && (
                                                                                    <div key={k} className="bg-white/80 rounded-xl px-4 py-2 border border-emerald-100">
                                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{k.replace(/_/g, ' ')}</p>
                                                                                        <p className="text-sm font-semibold text-slate-800 truncate">{String(v)}</p>
                                                                                    </div>
                                                                                )
                                                                            ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })} */}

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
                                                                {renderAcademicDocumentStatus('marksheet_12', '12th Marksheet')}
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
                                                                {renderAcademicDocumentStatus('marksheet_10', '10th Marksheet')}
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
                                                                    <button type="button" onClick={() => setProfileTab('work')} className="px-10 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20">Continue</button>
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

                                                    {/* Premium Academic Certificates Checklist */}
                                                    {/* <div className="mt-12 pt-8 border-t border-slate-100 space-y-6">
                                                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-indigo-600 text-[20px]">folder_managed</span>
                                                            Required Academic Certificates & Transcripts
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {(() => {
                                                                const studentDocs = getStudentDocumentRequirements(newStudent);
                                                                const academicDocs = studentDocs.filter(d => d.category === 'academic' && d.type !== 'resume' && d.type !== 'work_letters' && d.type !== 'english_test' && d.type !== 'aptitude_test');
                                                                return academicDocs.map((doc, idx) => {
                                                                    const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                    const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                    const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                    
                                                                    return (
                                                                        <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                    <span className="material-symbols-outlined text-[18px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                                                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="file"
                                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                                    ref={el => {
                                                                                        if (el) fileInputRefs.current[`academic-tab-${doc.type}`] = el;
                                                                                    }}
                                                                                    onChange={async (e) => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            await handleDocumentUpload(
                                                                                                file,
                                                                                                doc.type,
                                                                                                'applicant',
                                                                                                `${newStudent.firstName} ${newStudent.lastName}`.trim() || 'Applicant'
                                                                                            );
                                                                                            e.target.value = '';
                                                                                        }
                                                                                    }}
                                                                                    hidden
                                                                                />
                                                                                {isUploaded ? (
                                                                                    <>
                                                                                        <button type="button" onClick={() => viewFile(doc.type)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1">
                                                                                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                                            Review
                                                                                        </button>
                                                                                        <button type="button" onClick={() => handleDocumentDelete(doc.type, 'applicant', doc.name)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1">
                                                                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                            Remove
                                                                                        </button>
                                                                                    </>
                                                                                ) : (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => fileInputRefs.current[`academic-tab-${doc.type}`]?.click()}
                                                                                        disabled={uploadingDocs[`${doc.type}-applicant`] !== undefined}
                                                                                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[14px]">upload</span>
                                                                                        {uploadingDocs[`${doc.type}-applicant`] !== undefined ? `${Math.round(uploadingDocs[`${doc.type}-applicant`])}%` : 'Upload'}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div> */}
                                                </motion.div>
                                            )}

                                            {profileTab === 'loan' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200"
                                                >
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">account_balance</span>
                                                            Education Loan Details
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Loan Amount Needed (₹)*</label>
                                                                <input type="text" value={newStudent.loanAmount} onChange={e => setNewStudent({ ...newStudent, loanAmount: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. 2500000" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Target University / College*</label>
                                                                <input type="text" value={newStudent.targetUniversity} onChange={e => setNewStudent({ ...newStudent, targetUniversity: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Stanford University" />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select value={newStudent.studyDestination} onChange={e => setNewStudent({ ...newStudent, studyDestination: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Country</option>
                                                                    {getAllCountries().map(country => (
                                                                        <option key={country} value={country}>{country}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Course / Program Name*</label>
                                                                <input type="text" value={newStudent.courseName} onChange={e => setNewStudent({ ...newStudent, courseName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. MS in Computer Science" />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Academic Goal / Degree Level*</label>
                                                                <select value={newStudent.goal} onChange={e => setNewStudent({ ...newStudent, goal: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Goal...</option>
                                                                    <option value="Postgraduate">Postgraduate</option>
                                                                    <option value="Undergraduate">Undergraduate</option>
                                                                    <option value="Doctorate">Doctorate</option>
                                                                    <option value="Diploma">Diploma / Certificate</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Target Intake Season*</label>
                                                                <select value={newStudent.intakeSeason} onChange={e => setNewStudent({ ...newStudent, intakeSeason: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Intake...</option>
                                                                    {(() => {
                                                                        const cy = new Date().getFullYear();
                                                                        return [
                                                                            `Fall ${cy}`,
                                                                            `Spring ${cy + 1}`,
                                                                            `Summer ${cy + 1}`,
                                                                            `Fall ${cy + 1}`,
                                                                            `Spring ${cy + 2}`,
                                                                        ].map(opt => (
                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                        ));
                                                                    })()}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Study Budget / Estimated Cost*</label>
                                                                <select value={newStudent.budget} onChange={e => setNewStudent({ ...newStudent, budget: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Budget...</option>
                                                                    <option value="Under ₹15 Lakhs">Under ₹15 Lakhs</option>
                                                                    <option value="₹15 Lakhs - ₹25 Lakhs">₹15 Lakhs - ₹25 Lakhs</option>
                                                                    <option value="₹25 Lakhs - ₹40 Lakhs">₹25 Lakhs - ₹40 Lakhs</option>
                                                                    <option value="₹40 Lakhs - ₹60 Lakhs">₹40 Lakhs - ₹60 Lakhs</option>
                                                                    <option value="Above ₹60 Lakhs">Above ₹60 Lakhs</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Admit Status*</label>
                                                                <select value={newStudent.admitStatus} onChange={e => setNewStudent({ ...newStudent, admitStatus: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Status...</option>
                                                                    <option value="Admitted">Admitted (Has Admit Letter)</option>
                                                                    <option value="Applied">Applied (Awaiting Decision)</option>
                                                                    <option value="Planning">Planning to Apply</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Residential Pincode*</label>
                                                                <input type="text" maxLength={6} value={newStudent.pincode} onChange={e => setNewStudent({ ...newStudent, pincode: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. 560001" />
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    await handleSaveProfile(false);
                                                                }}
                                                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                                                            >
                                                                Save Loan Details
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    await handleSaveProfile(false);
                                                                    setProfileTab('work');
                                                                }}
                                                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
                                                            >
                                                                Continue
                                                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                                            </button>
                                                        </div>
                                                    </section>
                                                </motion.div>
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
                                                        {/* Premium Work Experience Documents Checklist */}
                                                        <div className="mt-12 pt-8 border-t border-slate-100 space-y-6">
                                                            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-indigo-600 text-[20px]">folder_managed</span>
                                                                Required Professional Experience Documents
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {(() => {
                                                                    const studentDocs = getStudentDocumentRequirements(newStudent);
                                                                    const workDocs = studentDocs.filter(d => d.type === 'resume' || d.type === 'work_letters');
                                                                    return workDocs.map((doc, idx) => {
                                                                        const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                        const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                        const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));

                                                                        return (
                                                                            <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                        <span className="material-symbols-outlined text-[18px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                                                        ref={el => {
                                                                                            if (el) fileInputRefs.current[`work-tab-${doc.type}`] = el;
                                                                                        }}
                                                                                        onChange={async (e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) {
                                                                                                await handleDocumentUpload(
                                                                                                    file,
                                                                                                    doc.type,
                                                                                                    'applicant',
                                                                                                    `${newStudent.firstName} ${newStudent.lastName}`.trim() || 'Applicant'
                                                                                                );
                                                                                                e.target.value = '';
                                                                                            }
                                                                                        }}
                                                                                        hidden
                                                                                    />
                                                                                    {isUploaded ? (
                                                                                        <>
                                                                                            <button type="button" onClick={() => viewFile(doc.type)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1">
                                                                                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                                                Review
                                                                                            </button>
                                                                                            <button type="button" onClick={() => handleDocumentDelete(doc.type, 'applicant', doc.name)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1">
                                                                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                                Remove
                                                                                            </button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => fileInputRefs.current[`work-tab-${doc.type}`]?.click()}
                                                                                            disabled={uploadingDocs[`${doc.type}-applicant`] !== undefined}
                                                                                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                                                                                        >
                                                                                            <span className="material-symbols-outlined text-[14px]">upload</span>
                                                                                            {uploadingDocs[`${doc.type}-applicant`] !== undefined ? `${Math.round(uploadingDocs[`${doc.type}-applicant`])}%` : 'Upload'}
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="mt-8 flex justify-end">
                                                            <button type="button" onClick={() => setProfileTab('tests')} className="px-10 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20">Continue</button>
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
                                                        {/* Premium Test Scores Documents Checklist */}
                                                        {/* <div className="mt-12 pt-8 border-t border-slate-100 space-y-6">
                                                            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-indigo-600 text-[20px]">folder_managed</span>
                                                                Required Standardized Test Scorecards
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {(() => {
                                                                    const studentDocs = getStudentDocumentRequirements(newStudent);
                                                                    const testDocs = studentDocs.filter(d => d.type === 'english_test' || d.type === 'aptitude_test');
                                                                    return testDocs.map((doc, idx) => {
                                                                        const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                        const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                        const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));

                                                                        return (
                                                                            <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                        <span className="material-symbols-outlined text-[18px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                                                        ref={el => {
                                                                                            if (el) fileInputRefs.current[`tests-tab-${doc.type}`] = el;
                                                                                        }}
                                                                                        onChange={async (e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) {
                                                                                                await handleDocumentUpload(
                                                                                                    file,
                                                                                                    doc.type,
                                                                                                    'applicant',
                                                                                                    `${newStudent.firstName} ${newStudent.lastName}`.trim() || 'Applicant'
                                                                                                );
                                                                                                e.target.value = '';
                                                                                            }
                                                                                        }}
                                                                                        hidden
                                                                                    />
                                                                                    {isUploaded ? (
                                                                                        <>
                                                                                            <button type="button" onClick={() => viewFile(doc.type)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1">
                                                                                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                                                Review
                                                                                            </button>
                                                                                            <button type="button" onClick={() => handleDocumentDelete(doc.type, 'applicant', doc.name)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1">
                                                                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                                Remove
                                                                                            </button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => fileInputRefs.current[`tests-tab-${doc.type}`]?.click()}
                                                                                            disabled={uploadingDocs[`${doc.type}-applicant`] !== undefined}
                                                                                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                                                                                        >
                                                                                            <span className="material-symbols-outlined text-[14px]">upload</span>
                                                                                            {uploadingDocs[`${doc.type}-applicant`] !== undefined ? `${Math.round(uploadingDocs[`${doc.type}-applicant`])}%` : 'Upload'}
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                        </div> */}
                                                        <div className="mt-8 flex justify-end">
                                                            <button type="button" onClick={() => setProfileTab('family')} className="px-10 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20">Continue</button>
                                                        </div>
                                                    </section>
                                                </div>
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
                                                                <input type="text" value={newStudent.family.fatherName} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherName: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                                <input type="tel" value={newStudent.family.fatherMobile} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherMobile: formatPhone(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.fatherMobile && !isPhoneValid(newStudent.family.fatherMobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email ID</label>
                                                                <input type="email" value={newStudent.family.fatherEmail} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherEmail: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Email Address" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Occupation</label>
                                                                <input type="text" value={newStudent.family.fatherOccupation} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherOccupation: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Occupation" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Father's Aadhar Number</label>
                                                                <input type="text" value={newStudent.family.fatherAadhar} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherAadhar: formatAadhar(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.fatherAadhar && !isAadharValid(newStudent.family.fatherAadhar) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="12 Digit Aadhar" maxLength={12} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Father's PAN Card</label>
                                                                <input type="text" value={newStudent.family.fatherPan} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherPan: formatPan(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.fatherPan && !isPanValid(newStudent.family.fatherPan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
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
                                                                <input type="text" value={newStudent.family.motherName} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherName: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                                <input type="tel" value={newStudent.family.motherMobile} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherMobile: formatPhone(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.motherMobile && !isPhoneValid(newStudent.family.motherMobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email ID</label>
                                                                <input type="email" value={newStudent.family.motherEmail} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherEmail: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Email Address" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Occupation</label>
                                                                <input type="text" value={newStudent.family.motherOccupation} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherOccupation: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Occupation" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mother's Aadhar Number</label>
                                                                <input type="text" value={newStudent.family.motherAadhar} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherAadhar: formatAadhar(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.motherAadhar && !isAadharValid(newStudent.family.motherAadhar) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="12 Digit Aadhar" maxLength={12} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mother's PAN Card</label>
                                                                <input type="text" value={newStudent.family.motherPan} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherPan: formatPan(e.target.value) } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.family.motherPan && !isPanValid(newStudent.family.motherPan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
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
                                                                            });
                                                                            handleSaveProfile(true);
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
                                                                            });
                                                                            handleSaveProfile(true);
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
                                                                <input type="text" value={newStudent.coApplicant.name} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, name: e.target.value, isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                                <input type="tel" value={newStudent.coApplicant.mobile} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, mobile: formatPhone(e.target.value), isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.coApplicant.mobile && !isPhoneValid(newStudent.coApplicant.mobile) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="Mobile Number" maxLength={10} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email ID</label>
                                                                <input type="email" value={newStudent.coApplicant.email} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, email: e.target.value, isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Email Address" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Relation with Applicant*</label>
                                                                <input type="text" value={newStudent.coApplicant.relation} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, relation: e.target.value, isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Relation" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Occupation</label>
                                                                <input type="text" value={newStudent.coApplicant.occupation} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, occupation: e.target.value, isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Occupation" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Aadhar Number</label>
                                                                <input type="text" value={newStudent.coApplicant.aadhar} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, aadhar: formatAadhar(e.target.value), isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.coApplicant.aadhar && !isAadharValid(newStudent.coApplicant.aadhar) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="12 Digit Aadhar" maxLength={12} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">PAN Card</label>
                                                                <input type="text" value={newStudent.coApplicant.pan} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, pan: formatPan(e.target.value), isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className={`w-full px-4 py-3 bg-slate-50 border ${newStudent.coApplicant.pan && !isPanValid(newStudent.coApplicant.pan) ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium`} placeholder="PAN Number" style={{ textTransform: 'uppercase' }} maxLength={10} />
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
                                                                    <select value={newStudent.family.fatherEmploymentType} onChange={e => { setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherEmploymentType: e.target.value } }); handleSaveProfile(true); }} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Employment Type</option>
                                                                        <option value="employed">Employed (Salaried)</option>
                                                                        <option value="self_employed_business">Self-Employed (Business)</option>
                                                                        <option value="self_employed_professional">Self-Employed (Professional)</option>
                                                                        <option value="retired">Retired</option>
                                                                        <option value="not_employed">Not Employed</option>
                                                                        <option value="expired">Deceased / Expired</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monthly Income (₹)</label>
                                                                    <input type="number" value={newStudent.family.fatherMonthlyIncome} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, fatherMonthlyIncome: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Monthly Income" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mother's Employment */}
                                                        <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
                                                            <h4 className="font-bold text-slate-700 mb-4">Mother's Employment</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employment Type*</label>
                                                                    <select value={newStudent.family.motherEmploymentType} onChange={e => { setNewStudent({ ...newStudent, family: { ...newStudent.family, motherEmploymentType: e.target.value } }); handleSaveProfile(true); }} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                        <option value="">Select Employment Type</option>
                                                                        <option value="employed">Employed (Salaried)</option>
                                                                        <option value="self_employed_business">Self-Employed (Business)</option>
                                                                        <option value="self_employed_professional">Self-Employed (Professional)</option>
                                                                        <option value="retired">Retired</option>
                                                                        <option value="not_employed">Not Employed</option>
                                                                        <option value="expired">Deceased / Expired</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monthly Income (₹)</label>
                                                                    <input type="number" value={newStudent.family.motherMonthlyIncome} onChange={e => setNewStudent({ ...newStudent, family: { ...newStudent.family, motherMonthlyIncome: e.target.value } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Monthly Income" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Co-Applicant's Employment */}
                                                        {newStudent.coApplicant.name && (
                                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                                <h4 className="font-bold text-slate-700 mb-4">Co-Applicant's Employment</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employment Type*</label>
                                                                        <select value={newStudent.coApplicant.employmentType} onChange={e => { setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, employmentType: e.target.value, isSameAsFather: false, isSameAsMother: false } }); handleSaveProfile(true); }} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                            <option value="">Select Employment Type</option>
                                                                            <option value="employed">Employed (Salaried)</option>
                                                                            <option value="self_employed_business">Self-Employed (Business)</option>
                                                                            <option value="self_employed_professional">Self-Employed (Professional)</option>
                                                                            <option value="retired">Retired</option>
                                                                            <option value="not_employed">Not Employed</option>
                                                                            <option value="expired">Deceased / Expired</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monthly Income (₹)</label>
                                                                        <input type="number" value={newStudent.coApplicant.monthlyIncome} onChange={e => setNewStudent({ ...newStudent, coApplicant: { ...newStudent.coApplicant, monthlyIncome: e.target.value, isSameAsFather: false, isSameAsMother: false } })} onBlur={() => handleSaveProfile()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Monthly Income" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </section>

                                                    {/* Dynamic Family & Co-applicant Documents Upload Checklists */}
                                                    <div className="mt-12 pt-8 border-t border-slate-100 space-y-8">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className="material-symbols-outlined text-indigo-600">badge</span>
                                                            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">Family & Co-Applicant Verification Documents</h4>
                                                        </div>

                                                        {/* Father's Documents Checklist */}
                                                        {newStudent.family.fatherEmploymentType ? (
                                                            <div className="space-y-4">
                                                                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                                                    <span className="material-symbols-outlined text-[16px] text-indigo-500">hail</span>
                                                                    {newStudent.family.fatherName || "Father"}'s Required Documents
                                                                </h5>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {(() => {
                                                                        const docs = getRequiredDocuments(newStudent.family.fatherEmploymentType, newStudent.family.fatherName || "Father", 'father');
                                                                        return docs.map((doc, idx) => {
                                                                            const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                            const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                            const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                            const uploadKey = `${doc.type}-father`;
                                                                            return (
                                                                                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                            <span className="material-symbols-outlined text-[18px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="file"
                                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                                            ref={el => {
                                                                                                if (el) fileInputRefs.current[`father-tab-${doc.type}`] = el;
                                                                                            }}
                                                                                            onChange={async (e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) {
                                                                                                    await handleDocumentUpload(file, doc.type, 'father', newStudent.family.fatherName || "Father", newStudent.family.fatherEmploymentType);
                                                                                                    e.target.value = '';
                                                                                                }
                                                                                            }}
                                                                                            hidden
                                                                                        />
                                                                                        {isUploaded ? (
                                                                                            <>
                                                                                                <button type="button" onClick={() => viewFile(doc.type)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1">
                                                                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                                                    Review
                                                                                                </button>
                                                                                                <button type="button" onClick={() => handleDocumentDelete(doc.type, 'father', doc.name)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1">
                                                                                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                                    Remove
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setSelectedDocType(doc.type);
                                                                                                    setSelectedDocName(doc.name);
                                                                                                    setSelectedDocCategory('father');
                                                                                                    setOnboardStep(3);
                                                                                                    setIsUploadModalOpen(true);
                                                                                                }}
                                                                                                disabled={uploadingDocs[uploadKey] !== undefined}
                                                                                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                                                                                            >
                                                                                                <span className="material-symbols-outlined text-[14px]">upload</span>
                                                                                                {uploadingDocs[uploadKey] !== undefined ? `${Math.round(uploadingDocs[uploadKey])}%` : 'Upload'}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {/* Mother's Documents Checklist */}
                                                        {newStudent.family.motherEmploymentType ? (
                                                            <div className="space-y-4 mt-6">
                                                                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                                                    <span className="material-symbols-outlined text-[16px] text-indigo-500">woman</span>
                                                                    {newStudent.family.motherName || "Mother"}'s Required Documents
                                                                </h5>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {(() => {
                                                                        const docs = getRequiredDocuments(newStudent.family.motherEmploymentType, newStudent.family.motherName || "Mother", 'mother');
                                                                        return docs.map((doc, idx) => {
                                                                            const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                            const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                            const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                            const uploadKey = `${doc.type}-mother`;
                                                                            return (
                                                                                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                            <span className="material-symbols-outlined text-[18px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="file"
                                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                                            ref={el => {
                                                                                                if (el) fileInputRefs.current[`mother-tab-${doc.type}`] = el;
                                                                                            }}
                                                                                            onChange={async (e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) {
                                                                                                    await handleDocumentUpload(file, doc.type, 'mother', newStudent.family.motherName || "Mother", newStudent.family.motherEmploymentType);
                                                                                                    e.target.value = '';
                                                                                                }
                                                                                            }}
                                                                                            hidden
                                                                                        />
                                                                                        {isUploaded ? (
                                                                                            <>
                                                                                                <button type="button" onClick={() => viewFile(doc.type)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1">
                                                                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                                                    Review
                                                                                                </button>
                                                                                                <button type="button" onClick={() => handleDocumentDelete(doc.type, 'mother', doc.name)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1">
                                                                                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                                    Remove
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setSelectedDocType(doc.type);
                                                                                                    setSelectedDocName(doc.name);
                                                                                                    setSelectedDocCategory('mother');
                                                                                                    setOnboardStep(3);
                                                                                                    setIsUploadModalOpen(true);
                                                                                                }}
                                                                                                disabled={uploadingDocs[uploadKey] !== undefined}
                                                                                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                                                                                            >
                                                                                                <span className="material-symbols-outlined text-[14px]">upload</span>
                                                                                                {uploadingDocs[uploadKey] !== undefined ? `${Math.round(uploadingDocs[uploadKey])}%` : 'Upload'}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {/* Co-applicant's Documents Checklist */}
                                                        {newStudent.coApplicant.employmentType ? (
                                                            <div className="space-y-4 mt-6">
                                                                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                                                    <span className="material-symbols-outlined text-[16px] text-indigo-500">group</span>
                                                                    {newStudent.coApplicant.name || "Co-applicant"}'s Required Documents
                                                                </h5>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {(() => {
                                                                        const docs = [
                                                                            ...getRequiredDocuments(newStudent.coApplicant.employmentType, newStudent.coApplicant.name || "Co-applicant", 'coapplicant'),
                                                                            { name: "Relation Proof with Applicant", type: "coapplicant_relation", required: true }
                                                                        ];
                                                                        return docs.map((doc, idx) => {
                                                                            const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                            const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                            const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                            const uploadKey = `${doc.type}-coapplicant`;
                                                                            return (
                                                                                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                            <span className="material-symbols-outlined text-[18px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{doc.type.toUpperCase().replace(/_/g, ' ')} • PDF/JPG/PNG</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="file"
                                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                                            ref={el => {
                                                                                                if (el) fileInputRefs.current[`coapplicant-tab-${doc.type}`] = el;
                                                                                            }}
                                                                                            onChange={async (e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) {
                                                                                                    await handleDocumentUpload(file, doc.type, 'coapplicant', newStudent.coApplicant.name || "Co-applicant", newStudent.coApplicant.employmentType);
                                                                                                    e.target.value = '';
                                                                                                }
                                                                                            }}
                                                                                            hidden
                                                                                        />
                                                                                        {isUploaded ? (
                                                                                            <>
                                                                                                <button type="button" onClick={() => viewFile(doc.type)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1">
                                                                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                                                    Review
                                                                                                </button>
                                                                                                <button type="button" onClick={() => handleDocumentDelete(doc.type, 'coapplicant', doc.name)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1">
                                                                                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                                                                                    Remove
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setSelectedDocType(doc.type);
                                                                                                    setSelectedDocName(doc.name);
                                                                                                    setSelectedDocCategory('coapplicant');
                                                                                                    setOnboardStep(3);
                                                                                                    setIsUploadModalOpen(true);
                                                                                                }}
                                                                                                disabled={uploadingDocs[uploadKey] !== undefined}
                                                                                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                                                                                            >
                                                                                                <span className="material-symbols-outlined text-[14px]">upload</span>
                                                                                                {uploadingDocs[uploadKey] !== undefined ? `${Math.round(uploadingDocs[uploadKey])}%` : 'Upload'}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {/* Optional Fallback Notice */}
                                                        {!newStudent.family.fatherEmploymentType && !newStudent.family.motherEmploymentType && !newStudent.coApplicant.employmentType ? (
                                                            <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center gap-4 text-amber-800">
                                                                <span className="material-symbols-outlined text-[32px] text-amber-500">info_outline</span>
                                                                <div>
                                                                    <h5 className="text-xs font-bold">Dynamic Documents List Pending</h5>
                                                                    <p className="text-[10px] font-medium text-amber-600/90 mt-0.5">Please select employment types for father, mother, or co-applicant to view and upload their required financial and KYC documents.</p>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-8 flex justify-end">
                                                        <button type="button" onClick={async () => { await proceedToDocuments(); addActivity("person", `Completed profile for ${newStudent.firstName}`, "person", "text-emerald-600 bg-emerald-50"); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Finalize & Proceed to Documents</button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="sticky bottom-0 mt-8 py-4 bg-[#f8fafc] border-t border-slate-200 flex justify-between items-center z-10">
                                                <button type="button" onClick={resetOnboardModal} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                                                <div className="flex gap-4">
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
                                                        <button type="button" onClick={proceedToDocuments} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                                                            Proceed to Documents
                                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : onboardStep === 3 ? (
                                        /* STEP 3: Documents Summary Dashboard */
                                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12 mt-4 font-['Plus_Jakarta_Sans',sans-serif]">
                                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-200 p-10 relative overflow-hidden">
                                                {/* Background Accents */}
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full filter blur-3xl -z-10 opacity-60" />
                                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full filter blur-3xl -z-10 opacity-60" />

                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-8 border-b border-slate-100 gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                            <span className="material-symbols-outlined text-[28px]">folder_managed</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Document Vault</h3>
                                                            <p className="text-xs text-slate-500 font-medium">Verify required KYC and academic credentials to finalize onboarding.</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
                                                            if (userId) fetchUserDocuments(userId);
                                                        }}
                                                        disabled={docsLoading}
                                                        className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 hover:shadow-sm"
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${docsLoading ? 'animate-spin' : ''}`}>sync</span>
                                                        {docsLoading ? 'Syncing...' : 'Sync Profile'}
                                                    </button>
                                                </div>

                                                {Object.keys(uploadMessages).length > 0 && (
                                                    <div className="space-y-2 mb-8">
                                                        {Object.entries(uploadMessages).map(([key, msg]) => (
                                                            <div
                                                                key={key}
                                                                className={`rounded-2xl px-4 py-3 text-xs font-bold border ${msg.type === 'success'
                                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                                    : msg.type === 'warning'
                                                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                    }`}
                                                            >
                                                                {msg.text}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Visual Completeness Bar */}
                                                {(() => {
                                                    const allReqs = getProfileDocumentRequirements(newStudent);


                                                    const total = allReqs.length;
                                                    const uploaded = allReqs.filter(d => {
                                                        const existingDoc = userDocuments.find(ud => ud.docType === d.type || ud.type === d.type);
                                                        const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                        return Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                    }).length;

                                                    const percent = total > 0 ? Math.round((uploaded / total) * 100) : 0;

                                                    return (
                                                        <div className="space-y-6 mb-10">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vault Completeness</p>
                                                                    <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{percent}% <span className="text-xs text-slate-500 font-semibold">({uploaded} of {total} documents uploaded)</span></h4>
                                                                </div>
                                                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${percent === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                                    {percent === 100 ? '🎉 All Set' : '⏳ Action Required'}
                                                                </div>
                                                            </div>
                                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${percent}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Central Gorgeous Popup Button Call-to-Action */}
                                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center space-y-6 mb-10 relative overflow-hidden group hover:border-indigo-200 hover:bg-indigo-50/5 transition-all">
                                                    <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors mx-auto group-hover:scale-105 transition-transform duration-300">
                                                        <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                                                    </div>
                                                    <div className="max-w-md mx-auto">
                                                        <h4 className="text-lg font-bold text-slate-900 leading-tight">Interactive Document Manager</h4>
                                                        <p className="text-xs text-slate-500 font-semibold mt-2">Click below to open the dedicated upload workspace to manage primary student KYC and identity verification documents (Passport, Aadhaar and PAN).</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const allReqs = getProfileDocumentRequirements(newStudent);
                                                            if (allReqs.length > 0) {
                                                                setSelectedDocType(allReqs[0].type);
                                                                setSelectedDocName(allReqs[0].name);

                                                                let cat: 'applicant' | 'father' | 'mother' | 'coapplicant' = 'applicant';
                                                                if (allReqs[0].type.startsWith('father_')) cat = 'father';
                                                                else if (allReqs[0].type.startsWith('mother_')) cat = 'mother';
                                                                else if (allReqs[0].type.startsWith('coapplicant_')) cat = 'coapplicant';
                                                                setSelectedDocCategory(cat);
                                                            }
                                                            setIsUploadModalOpen(true);
                                                        }}
                                                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all flex items-center gap-2.5 mx-auto"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                        Open Upload Documents Popup
                                                    </button>
                                                </div>

                                                {/* Dynamic Document Directory Directory Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 mt-8">
                                                    {/* Card 1: Student Identity & KYC */}
                                                    {/* <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                                            <span className="material-symbols-outlined text-[20px] text-indigo-600">fingerprint</span>
                                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Student Identity & KYC</h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {getStudentDocumentRequirements(newStudent).filter(d => ['passport', 'national_id', 'pan'].includes(d.type)).map((doc, idx) => {
                                                                const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:border-slate-300 transition-all shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`material-symbols-outlined text-[18px] ${isUploaded ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                {isUploaded ? 'check_circle' : 'circle'}
                                                                            </span>
                                                                            <div>
                                                                                <span className="text-xs font-semibold text-slate-800">{doc.name}</span>
                                                                                {!isUploaded && (
                                                                                    <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${doc.required ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                                        {doc.required ? 'Required' : 'Optional'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedDocType(doc.type);
                                                                                setSelectedDocName(doc.name);
                                                                                setSelectedDocCategory('applicant');
                                                                                setIsUploadModalOpen(true);
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                                                isUploaded 
                                                                                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200' 
                                                                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50'
                                                                            }`}
                                                                        >
                                                                            <span className="material-symbols-outlined text-[13px]">{isUploaded ? 'rate_review' : 'cloud_upload'}</span>
                                                                            {isUploaded ? 'Review / Edit' : 'Upload'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div> */}

                                                    {/* Card 2: Academic & Credentials */}
                                                    {/* <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                                            <span className="material-symbols-outlined text-[20px] text-indigo-600">school</span>
                                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Academic & Credentials</h4>
                                                        </div>
                                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                            {getStudentDocumentRequirements(newStudent).filter(d => ['marksheet_10', 'marksheet_12', 'ug_transcript', 'ug_degree', 'pg_transcript', 'pg_degree', 'english_test', 'aptitude_test', 'resume', 'work_letters'].includes(d.type)).map((doc, idx) => {
                                                                const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:border-slate-300 transition-all shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`material-symbols-outlined text-[18px] ${isUploaded ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                {isUploaded ? 'check_circle' : 'circle'}
                                                                            </span>
                                                                            <div>
                                                                                <span className="text-xs font-semibold text-slate-800">{doc.name}</span>
                                                                                {!isUploaded && (
                                                                                    <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${doc.required ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                                        {doc.required ? 'Required' : 'Optional'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedDocType(doc.type);
                                                                                setSelectedDocName(doc.name);
                                                                                setSelectedDocCategory('applicant');
                                                                                setIsUploadModalOpen(true);
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                                                isUploaded 
                                                                                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200' 
                                                                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50'
                                                                            }`}
                                                                        >
                                                                            <span className="material-symbols-outlined text-[13px]">{isUploaded ? 'rate_review' : 'cloud_upload'}</span>
                                                                            {isUploaded ? 'Review / Edit' : 'Upload'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div> */}

                                                    {/* Card 3: Father's Verification */}
                                                    {/* {(() => {
                                                        const docs = getProfileDocumentRequirements(newStudent).filter(d => d.type.startsWith('father_'));
                                                        if (docs.length === 0) return null;
                                                        const fatherName = newStudent.family.fatherName || "Father";
                                                        return (
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                                                    <span className="material-symbols-outlined text-[20px] text-indigo-600">hail</span>
                                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">{fatherName}'s Documents</h4>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {docs.map((doc, idx) => {
                                                                        const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                        const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                        const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                        return (
                                                                            <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:border-slate-300 transition-all shadow-sm">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className={`material-symbols-outlined text-[18px] ${isUploaded ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                        {isUploaded ? 'check_circle' : 'circle'}
                                                                                    </span>
                                                                                    <div>
                                                                                        <span className="text-xs font-semibold text-slate-800">{doc.name}</span>
                                                                                        {!isUploaded && (
                                                                                            <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${doc.required ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                                                {doc.required ? 'Required' : 'Optional'}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedDocType(doc.type);
                                                                                        setSelectedDocName(doc.name);
                                                                                        setSelectedDocCategory('father');
                                                                                        setIsUploadModalOpen(true);
                                                                                    }}
                                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                                                        isUploaded 
                                                                                            ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200' 
                                                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50'
                                                                                    }`}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[13px]">{isUploaded ? 'rate_review' : 'cloud_upload'}</span>
                                                                                    {isUploaded ? 'Review / Edit' : 'Upload'}
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()} */}

                                                    {/* Card 4: Mother's Verification */}
                                                    {/* {(() => {
                                                        const docs = getProfileDocumentRequirements(newStudent).filter(d => d.type.startsWith('mother_'));
                                                        if (docs.length === 0) return null;
                                                        const motherName = newStudent.family.motherName || "Mother";
                                                        return (
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                                                    <span className="material-symbols-outlined text-[20px] text-indigo-600">woman</span>
                                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">{motherName}'s Documents</h4>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {docs.map((doc, idx) => {
                                                                        const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                        const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                        const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                        return (
                                                                            <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:border-slate-300 transition-all shadow-sm">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className={`material-symbols-outlined text-[18px] ${isUploaded ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                        {isUploaded ? 'check_circle' : 'circle'}
                                                                                    </span>
                                                                                    <div>
                                                                                        <span className="text-xs font-semibold text-slate-800">{doc.name}</span>
                                                                                        {!isUploaded && (
                                                                                            <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${doc.required ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                                                {doc.required ? 'Required' : 'Optional'}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedDocType(doc.type);
                                                                                        setSelectedDocName(doc.name);
                                                                                        setSelectedDocCategory('mother');
                                                                                        setIsUploadModalOpen(true);
                                                                                    }}
                                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${isUploaded
                                                                                            ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50'
                                                                                        }`}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[13px]">{isUploaded ? 'rate_review' : 'cloud_upload'}</span>
                                                                                    {isUploaded ? 'Review / Edit' : 'Upload'}
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()} */}

                                                    {/* Card 5: Co-applicant Verification */}
                                                    {/* {(() => {
                                                        const docs = getProfileDocumentRequirements(newStudent).filter(d => d.type.startsWith('coapplicant_'));
                                                        if (docs.length === 0) return null;
                                                        const coName = newStudent.coApplicant.name || "Co-applicant";
                                                        return (
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                                                    <span className="material-symbols-outlined text-[20px] text-indigo-600">group</span>
                                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">{coName}'s Documents</h4>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {docs.map((doc, idx) => {
                                                                        const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                        const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                        const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                        return (
                                                                            <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:border-slate-300 transition-all shadow-sm">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className={`material-symbols-outlined text-[18px] ${isUploaded ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                        {isUploaded ? 'check_circle' : 'circle'}
                                                                                    </span>
                                                                                    <div>
                                                                                        <span className="text-xs font-semibold text-slate-800">{doc.name}</span>
                                                                                        {!isUploaded && (
                                                                                            <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${doc.required ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                                                {doc.required ? 'Required' : 'Optional'}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedDocType(doc.type);
                                                                                        setSelectedDocName(doc.name);
                                                                                        setSelectedDocCategory('coapplicant');
                                                                                        setIsUploadModalOpen(true);
                                                                                    }}
                                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                                                        isUploaded 
                                                                                            ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200' 
                                                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50'
                                                                                    }`}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[13px]">{isUploaded ? 'rate_review' : 'cloud_upload'}</span>
                                                                                    {isUploaded ? 'Review / Edit' : 'Upload'}
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()} */}
                                                </div>

                                                {/* Bottom Navigation Row */}
                                                {/* Bottom Navigation Row */}
                                                <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                                                    <button type="button" onClick={() => setOnboardStep(2)} className="px-6 py-3.5 text-slate-600 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all flex items-center gap-2 bg-white border border-slate-200 rounded-2xl">
                                                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                                        Back to Profile
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleFinalOnboardSubmit}
                                                        disabled={createLoading}
                                                        className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2 group disabled:opacity-50"
                                                    >
                                                        {createLoading ? 'Finalizing...' : 'Complete Onboarding'}
                                                        {!createLoading && <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">verified</span>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : false ? (
                                        /* STEP 3: Documents */
                                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12 mt-4">
                                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[24px]">folder_managed</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold font-['Playfair_Display',serif] text-slate-900">Applicant Documents</h3>
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
                                                        <h4 className="text-[10px] font-bold font-['Playfair_Display',serif] uppercase tracking-widest text-emerald-600 mb-5 bg-emerald-50 px-3 py-1 rounded-full w-fit">Primary Applicant Documents</h4>
                                                        <div className="space-y-3">
                                                            {getStudentDocumentRequirements(newStudent).map((doc, i) => {
                                                                const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                return (
                                                                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUploaded ? 'bg-white text-emerald-500 border border-emerald-100' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                                                <span className="material-symbols-outlined text-[20px]">{isUploaded ? 'task_alt' : 'description'}</span>
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                    {isUploaded && (
                                                                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                                    <p className="text-[10px] text-slate-500 font-medium">{doc.type.toUpperCase().replace('_', ' ')} • PDF/JPG/PNG</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            {isUploaded ? (
                                                                                <>
                                                                                    <button onClick={() => viewFile(doc.type)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
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
                                                                                                const meta = existingDoc.verificationMetadata;
                                                                                                if (meta) {
                                                                                                    const extractedFields = meta.details?.extractedFields || meta.extractedFields || meta.ocrResult?.extractedFields || (typeof meta === 'object' ? meta : null);
                                                                                                    if (extractedFields && Object.keys(extractedFields).length > 0) {
                                                                                                        await autoFillFromOcr(doc.type, extractedFields);
                                                                                                    }
                                                                                                }
                                                                                                alert(`✅ ${doc.name} verified and updated in user profile!`);
                                                                                                fetchUserDocuments(userId);
                                                                                            } catch (e) {
                                                                                                console.error("Verification error:", e);
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
                                                                                                await handleDocumentUpload(
                                                                                                    file,
                                                                                                    doc.type,
                                                                                                    'applicant',
                                                                                                    newStudent.firstName + ' ' + newStudent.lastName,
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
                                                                <span className="text-[9px] text-slate-500 font-medium">📋 Select employment type to see required documents</span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-3">
                                                            {newStudent.family.fatherEmploymentType ? (
                                                                getRequiredDocuments(newStudent.family.fatherEmploymentType, newStudent.family.fatherName || "Father", 'father').map((doc, i) => {
                                                                    const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                    const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                    const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                    return (
                                                                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : doc.required ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : doc.required ? 'bg-white border-red-200 text-red-500' : 'bg-white border-amber-200 text-amber-500'}`}>
                                                                                    <span className="material-symbols-outlined text-[20px]">{isUploaded ? 'task_alt' : doc.required ? 'exclamation' : 'info'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                        {isUploaded && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>}
                                                                                        {!isUploaded && doc.required && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">REQUIRED</span>}
                                                                                        {!isUploaded && !doc.required && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">OPTIONAL</span>}
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
                                                                                            await handleDocumentUpload(
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
                                                                                        isUploaded ? 'Re-upload' : 'Upload'
                                                                                    }
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
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
                                                                <span className="text-[9px] text-slate-500 font-medium">📋 Select employment type to see required documents</span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-3">
                                                            {newStudent.family.motherEmploymentType ? (
                                                                getRequiredDocuments(newStudent.family.motherEmploymentType, newStudent.family.motherName || "Mother", 'mother').map((doc, i) => {
                                                                    const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                    const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                    const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                    return (
                                                                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : doc.required ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : doc.required ? 'bg-white border-red-200 text-red-500' : 'bg-white border-amber-200 text-amber-500'}`}>
                                                                                    <span className="material-symbols-outlined text-[20px]">{isUploaded ? 'task_alt' : doc.required ? 'exclamation' : 'info'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                        {isUploaded && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>}
                                                                                        {!isUploaded && doc.required && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">REQUIRED</span>}
                                                                                        {!isUploaded && !doc.required && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">OPTIONAL</span>}
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
                                                                                            await handleDocumentUpload(
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
                                                                                        isUploaded ? 'Re-upload' : 'Upload'
                                                                                    }
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
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
                                                                <span className="text-[9px] text-slate-500 font-medium">📋 Select employment type to see required documents</span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-3">
                                                            {newStudent.coApplicant.employmentType ? (
                                                                [
                                                                    ...getRequiredDocuments(newStudent.coApplicant.employmentType, newStudent.coApplicant.name || "Co-applicant", 'coapplicant'),
                                                                    { name: "Relation Proof with Applicant", type: "coapplicant_relation", required: true }
                                                                ].map((doc, i) => {
                                                                    const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                                    const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                                    const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                                    return (
                                                                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : doc.required ? 'bg-violet-50/50 border-violet-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isUploaded ? 'bg-white text-emerald-500 border-emerald-100' : doc.required ? 'bg-white border-violet-200 text-violet-500' : 'bg-white border-amber-200 text-amber-500'}`}>
                                                                                    <span className="material-symbols-outlined text-[20px]">{isUploaded ? 'task_alt' : doc.required ? 'exclamation' : 'info'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                                        {isUploaded && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>}
                                                                                        {!isUploaded && doc.required && <span className="px-1.5 py-0.5 bg-violet-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">REQUIRED</span>}
                                                                                        {!isUploaded && !doc.required && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">OPTIONAL</span>}
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
                                                                                            await handleDocumentUpload(
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
                                                                                        isUploaded ? 'Re-upload' : 'Upload'
                                                                                    }
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
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
                                    ) : onboardStep === 4 ? (
                                        /* STEP 4: Distribution / Sharing */
                                        <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                            <div className="text-center mb-12">
                                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                                                    <span className="material-symbols-outlined text-[40px]">check_circle</span>
                                                </div>
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Onboarding Distribution</h3>
                                                <p className="text-slate-500 text-sm font-medium mt-2 max-w-md mx-auto">
                                                    Profile is finalized! You can now share the complete data bundle with the bank or the student.
                                                </p>
                                            </div>

                                            {!shareResult ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                                                        <div className="flex items-center gap-4 mb-2">
                                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-[24px]">share</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900">Share Parameters</h4>
                                                                <p className="text-[10px] font-bold text-slate-400">Secure data distribution</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Recipient Type</label>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setShareTarget('bank'); setShareName(""); }}
                                                                        className={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${shareTarget === 'bank' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                                    >
                                                                        🏦 Bank
                                                                    </button>
                                                                    {/* <button
                                                                        type="button"
                                                                        onClick={() => { setShareTarget('student'); setShareName(`${newStudent.firstName} ${newStudent.lastName}`); setShareEmail(newStudent.email); }}
                                                                        className={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${shareTarget === 'student' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                                    >
                                                                        🎓 Student
                                                                    </button> */}
                                                                </div>
                                                            </div>

                                                            {shareTarget === 'bank' && (
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Bank Name</label>
                                                                    <select value={shareName} onChange={e => handleBankSelect(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}>
                                                                        <option value="">Select a bank</option>
                                                                        {availableBanks.length > 0 ? (
                                                                            availableBanks.map((b: any, idx: number) => (
                                                                                <option key={b.id || idx} value={b.name}>{b.name}</option>
                                                                            ))
                                                                        ) : (
                                                                            <>
                                                                                <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
                                                                                <option value="Avanse Financial">Avanse Financial</option>
                                                                                <option value="Auxilo Finserve">Auxilo Finserve</option>
                                                                                <option value="HDFC Credila">HDFC Credila</option>
                                                                                <option value="Poonawalla Fincorp">Poonawalla Fincorp</option>
                                                                            </>
                                                                        )}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address</label>
                                                                <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="recipient@example.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Internal Note (Optional)</label>
                                                                <textarea value={shareMessage} onChange={e => setShareMessage(e.target.value)} rows={3} placeholder="Add a message for the recipient..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" />
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={handleDistributionShare}
                                                            disabled={isSharing || !shareEmail || (shareTarget === 'bank' && !shareName)}
                                                            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                                                        >
                                                            {isSharing ? (shareTarget === 'student' ? 'Sharing with Student...' : 'Sharing with Bank...') : (shareTarget === 'student' ? 'Share with Student' : 'Share Complete Profile')}
                                                            {!isSharing && <span className="material-symbols-outlined text-[20px]">send</span>}
                                                        </button>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[32px]">
                                                            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-4 flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                                                Security Protocol
                                                            </h4>
                                                            <ul className="space-y-4">
                                                                {[
                                                                    { icon: 'lock', text: 'Secure unique access token generated per recipient' },
                                                                    { icon: 'visibility', text: 'All documents shared in read-only format' },
                                                                    { icon: 'history', text: 'Access is automatically logged for audit trail' },
                                                                    { icon: 'timer', text: 'Link automatically expires after 30 days' },
                                                                ].map((item, i) => (
                                                                    <li key={i} className="flex items-start gap-3">
                                                                        <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5">{item.icon}</span>
                                                                        <span className="text-[11px] font-bold text-slate-600 leading-relaxed">{item.text}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <button onClick={resetOnboardModal} className="w-full py-5 border-2 border-slate-200 text-slate-500 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                                                            Finish Without Sharing
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
                                                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 rotate-6 hover:rotate-0 transition-all duration-300">
                                                        <span className="material-symbols-outlined text-[48px]">check_circle</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Verification Complete</h4>
                                                        <p className="text-slate-500 text-sm font-medium">The secure application has been successfully generated.</p>
                                                    </div>

                                                    {/* Clean & Premium Application ID Card */}
                                                    <div className="max-w-sm mx-auto bg-gradient-to-br from-indigo-50/60 via-indigo-50/20 to-slate-50 border border-indigo-100 p-6 rounded-3xl shadow-sm space-y-4">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[14px]">assignment</span>
                                                                Loan Application ID
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl font-black text-slate-900 font-mono tracking-tight bg-white px-4 py-2 border border-slate-100 rounded-2xl shadow-sm">
                                                                    {shareResult.applicationNumber || shareResult.applicationId || "PENDING"}
                                                                </span>
                                                                {(shareResult.applicationNumber || shareResult.applicationId) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(shareResult.applicationNumber || shareResult.applicationId || "");
                                                                            alert("Application ID copied!");
                                                                        }}
                                                                        className="p-3 bg-white text-indigo-600 rounded-2xl hover:text-indigo-700 hover:shadow-md hover:bg-slate-50 transition-all border border-indigo-100 shadow-sm"
                                                                        title="Copy Application ID"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px] block">content_copy</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Neat Access Link Distribution Section */}
                                                    <div className="max-w-sm mx-auto space-y-3">
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(shareResult.url);
                                                                alert("Portal access link copied!");
                                                            }}
                                                            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">share_windows</span>
                                                            Copy Secure Access Link
                                                        </button>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                                            Expires on: {new Date(shareResult.expires).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-100 flex gap-4 w-full max-w-sm mx-auto">
                                                        <button onClick={() => setShareResult(null)} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                                                            Share Again
                                                        </button>
                                                        <button onClick={resetOnboardModal} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20">
                                                            Close Workflow
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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
                                    <p className="text-[11px] text-slate-500">Review and select which documents to share from the student&apos;s profile.</p>
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
                                    <button onClick={startOnboarding} className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px] hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">person_add</span> Add Student
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label="Total Applications"
                                    value={stats.apps?.total}
                                    icon="description"
                                    color="text-blue-600"
                                    loading={loading}
                                    hint={`${stats.apps?.total > pendingCount ? stats.apps.total - pendingCount : 0} Processed`}
                                />
                                <div className="cursor-pointer" onClick={() => setFilterStatus('pending')}>
                                    <StatCard
                                        label="Awaiting Review"
                                        value={pendingCount}
                                        icon="hourglass_empty"
                                        color="text-amber-600"
                                        loading={loading}
                                        hint="Avg. age: 4 hours"
                                        badge={pendingCount > 0 ? `${pendingCount} Urgent` : undefined}
                                        trend="⏳ Pending"
                                    />
                                </div>
                                <StatCard
                                    label="Approval Rate"
                                    value={`${approvalRate}%`}
                                    icon="check_circle"
                                    color="text-emerald-600"
                                    loading={loading}
                                    trend="📈 +1.2% this month"
                                />
                                <StatCard
                                    label="Total Users"
                                    value={stats.users?.total ?? 0}
                                    icon="group"
                                    color="text-purple-600"
                                    loading={loading}
                                    hint="3 joined today"
                                    footerAction="View List ➔"
                                    onFooterActionClick={(e: any) => { e.stopPropagation(); navigateToSection('applicants'); }}
                                />
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
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[11px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] uppercase tracking-wider">Recent Activity</h3>
                                            <button onClick={() => navigateToSection('activities')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
                                        </div>
                                        <div className="space-y-2.5">
                                            {recentActivity.length === 0 ? (
                                                <div className="py-6 text-center">
                                                    <span className="material-symbols-outlined text-3xl text-slate-200 mb-2 block">history</span>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activity yet</p>
                                                    <p className="text-[10px] text-slate-300 mt-0.5">Actions will appear here as you work</p>
                                                </div>
                                            ) : recentActivity.map(a => (
                                                <div key={a.id} className="flex items-start gap-2.5">
                                                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${a.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{a.icon}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-medium text-slate-800 leading-snug">{a.msg}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                                                        {(a.createdAt || a.rawTime) && (
                                                            <p className="text-[9px] text-slate-300 mt-0.5 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                                {formatAbsoluteDateTime(a.createdAt || a.rawTime)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <button onClick={() => { navigateToSection('chat_customer'); setAutoStartUser(null); }} className="w-full text-left p-3 rounded border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center gap-3 bg-white shadow-sm">
                                            <span className="material-symbols-outlined text-indigo-500 text-[18px]">forum</span>
                                            <span className="text-[12px] font-medium text-slate-800">Support Chat</span>
                                            <span className="material-symbols-outlined text-slate-300 ml-auto text-[14px]">arrow_forward_ios</span>
                                        </button>
                                        <button onClick={() => navigateToSection('applicants')} className="w-full text-left p-3 rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center gap-3 bg-white shadow-sm">
                                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">manage_accounts</span>
                                            <span className="text-[12px] font-medium text-slate-800">Applicant Profiles</span>
                                            <span className="material-symbols-outlined text-slate-300 ml-auto text-[14px]">arrow_forward_ios</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "activities" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
                            {/* Header Panel */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-[26px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] tracking-tight flex items-center gap-3">
                                        Audit Trail & Logs
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            FULL HISTORY
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Reviewing comprehensive administrative activity and system logs.</p>
                                </div>
                                <button
                                    onClick={loadFullActivities}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                >
                                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                                    Refresh Logs
                                </button>
                            </div>

                            {/* Filters Bar */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Search */}
                                <div className="relative flex-1 max-w-md">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search activities by message or initiator..."
                                        value={activitiesSearch}
                                        onChange={(e) => { setActivitiesSearch(e.target.value); setActivitiesPage(1); }}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Type Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {[
                                        { key: "all", label: "ALL EVENTS", icon: "select_all", color: "bg-slate-100 text-slate-700" },
                                        { key: "new", label: "REGISTRATIONS", icon: "person_add", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                                        { key: "update", label: "DOSSIER SYNCS", icon: "sync", color: "bg-blue-50 text-blue-700 border-blue-100" },
                                        { key: "upload", label: "UPLOADS", icon: "upload_file", color: "bg-purple-50 text-purple-700 border-purple-100" },
                                        { key: "share", label: "DISTRIBUTION", icon: "send", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                                        { key: "approved", label: "APPROVALS", icon: "task_alt", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                                        { key: "rejected", label: "DELETIONS", icon: "delete", color: "bg-rose-50 text-rose-700 border-rose-100" },
                                    ].map((badge) => (
                                        <button
                                            key={badge.key}
                                            onClick={() => { setActivitiesFilter(badge.key); setActivitiesPage(1); }}
                                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${activitiesFilter === badge.key
                                                ? "bg-[#0f172a] text-white border-[#0f172a] shadow-md shadow-slate-900/10 scale-95"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                                            {badge.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline Table/List */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronological Event Timeline</span>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">{activitiesTotal} System Records Found</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {activitiesLoading ? (
                                        <div className="p-24 text-center">
                                            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading secure database logs...</p>
                                        </div>
                                    ) : fullActivities.length > 0 ? (
                                        fullActivities.map((a, i) => (
                                            <div key={a.id || i} className="p-5 hover:bg-slate-50/60 transition-all group flex items-start gap-4">
                                                {/* Action Icon */}
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${a.color || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                    <span className="material-symbols-outlined text-[20px]">{a.icon || 'history'}</span>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-1.5">
                                                        <p className="text-[14px] font-bold text-slate-900 leading-snug tracking-tight">{a.msg}</p>
                                                        <div className="text-right shrink-0 mt-1 md:mt-0">
                                                            <span className="text-[11px] font-semibold text-slate-400 tabular-nums block">{a.time}</span>
                                                            {a.createdAt && (
                                                                <span className="text-[10px] text-slate-300 tabular-nums flex items-center gap-1 justify-end mt-0.5">
                                                                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                                    {formatAbsoluteDateTime(a.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Meta Metadata tags */}
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {/* Action Category Tag */}
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                            TYPE: {a.type}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200" />

                                                        {/* Actor Identification */}
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                            <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                                                <img
                                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.actorEmail || a.actorName}`}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <span>Actor: {a.actorName}</span>
                                                            {a.actorEmail && <span className="text-slate-400 font-medium">({a.actorEmail})</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-24 text-center">
                                            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">manage_search</span>
                                            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">No Auditable Actions Found</p>
                                            <p className="text-[11px] text-slate-400 mt-1">Try modifying search keywords or filters.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Console */}
                                {activitiesTotal > activitiesLimit && (
                                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex flex-col">
                                            {/* <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Navigation Console</p> */}
                                            <p className="text-[11px] font-bold text-slate-700">
                                                Page <span className="text-indigo-600">{activitiesPage}</span> of {Math.ceil(activitiesTotal / activitiesLimit)}
                                                <span className="mx-2 text-slate-300">|</span>
                                                Total Records: <span className="text-slate-900">{activitiesTotal}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={activitiesPage === 1 || activitiesLoading}
                                                onClick={() => {
                                                    setActivitiesPage(prev => Math.max(1, prev - 1));
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                                Previous
                                            </button>
                                            <div className="flex items-center gap-1 mx-2">
                                                {[...Array(Math.min(5, Math.ceil(activitiesTotal / activitiesLimit)))].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setActivitiesPage(pageNum)}
                                                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${activitiesPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                                {Math.ceil(activitiesTotal / activitiesLimit) > 5 && <span className="text-slate-400 text-[10px] font-black px-1">...</span>}
                                            </div>
                                            <button
                                                disabled={activitiesPage >= Math.ceil(activitiesTotal / activitiesLimit) || activitiesLoading}
                                                onClick={() => {
                                                    setActivitiesPage(prev => prev + 1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                                            >
                                                Next
                                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                                            onClick={startOnboarding}
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
                                                <span className={`text-[11px] font-['Playfair_Display',serif] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.bg} ${c.color}`}>{c.tag}</span>
                                            </div>
                                            <p className="text-[32px] font-bold text-slate-900 leading-none mb-1">{loading ? <span className="block w-8 h-6 bg-slate-100 animate-pulse rounded" /> : c.value}</p>
                                            <p className="text-[12px] font-['Playfair_Display',serif] font-bold text-slate-500 uppercase tracking-widest">{c.label}</p>
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
                                            <p className="text-[28px] font-bold text-slate-900 leading-none mb-1">{loading ? <span className="block w-8 h-6 bg-slate-100 animate-pulse rounded" /> : c.value}</p>
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
                                            <p className="text-[28px] font-bold text-slate-900 leading-none mb-1">{loading ? <span className="block w-8 h-6 bg-slate-100 animate-pulse rounded" /> : c.value}</p>
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
                                                    <th className="sticky left-0 z-20 bg-slate-50 px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">APPLICANT PROFILE</span></th>
                                                    <th className="sticky left-[250px] min-w-[200px] z-20 bg-slate-50 px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">USER ID</span></th>
                                                    <th className="sticky left-[420px] z-20 bg-slate-50 px-5 py-5"><span className="flex items-center gap-1.5 text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">mail</span> CONTACT</span></th>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">COLLEGE NAME</span></th>
                                                    <th className="px-5 py-5"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">PROGRAM FOCUS</span></th>
                                                    <th className="px-6 py-5 min-w-[240px] w-[240px]"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">TARGET BANK</span></th>
                                                    <th className="px-5 py-5 w-48"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">PROGRESS</span></th>
                                                    <th className="px-5 py-5 min-w-[220px] w-[220px]"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">CURRENT STATUS</span></th>
                                                    <th className="px-5 py-5 text-center"><span className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">ACTIONS</span></th>
                                                </>
                                            )}
                                            {activeSection === "users" && (
                                                <>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[12px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">person</span> PROFILE</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[12px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">mail</span> CONTACT</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[12px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">verified_user</span> ACCESS ROLE</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[12px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">schedule</span> LAST SESSION</span></th>
                                                    <th className="px-5 py-3.5"><span className="flex items-center gap-1.5 text-[12px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest"><span className="material-symbols-outlined text-[14px]">calendar_today</span> REGISTERED</span></th>
                                                    <th className="px-5 py-3.5 text-center"><span className="text-[12px] font-['Playfair_Display',serif] font-bold text-slate-600 uppercase tracking-widest">ACTIONS</span></th>
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
                                            ) : pagedData.length > 0 ? pagedData.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                    {activeSection === "blogs" && (
                                                        <>
                                                            <td className="px-5 py-4">
                                                                <p className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight mb-1">{item.title}</p>
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
                                                                    {item.updatedAt ? format(convertToIST(item.updatedAt), 'MMM d, yyyy') : 'NOT_MODIFIED'}
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
                                                        const initials = `${(item.firstName || item.student?.firstName || '?')[0]}${(item.lastName || item.student?.lastName || '')[0] || ''}`;
                                                        const stageLabel = item.currentStage || (progress <= 12 ? 'Application Created' : progress <= 40 ? 'Documents Uploaded' : progress <= 70 ? 'Under Review' : progress <= 85 ? 'Credit Check' : progress <= 90 ? 'Sanction' : 'Disbursement');
                                                        const isOnline = (item.email || item.student?.email) && onlineEmails.map(e => e.toLowerCase()).includes((item.email || item.student?.email).toLowerCase());
                                                        return (
                                                            <>
                                                                <td className="sticky left-0 z-10 bg-white px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex items-center gap-4">
                                                                        <div
                                                                            onClick={() => {
                                                                                const uid = item.userId || item.user_id || item.student?.id || item.student?._id;
                                                                                const email = item.email || item.student?.email;
                                                                                const params = new URLSearchParams();
                                                                                if (email) params.append('email', email);
                                                                                const queryStr = params.toString();
                                                                                if (uid) window.open(`/staff/users/${uid}${queryStr ? `?${queryStr}` : ''}`, '_blank');
                                                                            }}
                                                                            className="relative shrink-0 cursor-pointer group/avatar hover:scale-105 transition-all"
                                                                            title="Click to view Student Profile"
                                                                        >
                                                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover/avatar:border-indigo-400 group-hover/avatar:text-indigo-600 flex items-center justify-center font-medium text-[13px] text-slate-600 transition-all">
                                                                                {initials}
                                                                            </div>
                                                                            {isOnline && (
                                                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm shadow-emerald-500/30" />
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p
                                                                                onClick={() => {
                                                                                    const uid = item.userId || item.user_id || item.student?.id || item.student?._id;
                                                                                    const email = item.email || item.student?.email;
                                                                                    const params = new URLSearchParams();
                                                                                    if (email) params.append('email', email);
                                                                                    const queryStr = params.toString();
                                                                                    if (uid) window.open(`/staff/users/${uid}${queryStr ? `?${queryStr}` : ''}`, '_blank');
                                                                                }}
                                                                                className="text-[16px] font-['Playfair_Display',serif] font-bold text-[#060708] leading-tight truncate cursor-pointer hover:text-slate-600 transition-all"
                                                                                title="Click to view Student Profile"
                                                                            >
                                                                                {item.firstName || item.student?.firstName || '—'} {item.lastName || item.student?.lastName || ''}
                                                                            </p>
                                                                            <p
                                                                                onClick={() => setSelectedApp(item)}
                                                                                className="text-[9px] text-slate-500 hover:text-slate-600 cursor-pointer transition-all font-black mt-1 uppercase tracking-widest inline-block"
                                                                                title="Click to view Application Details"
                                                                            >
                                                                                {item.applicationNumber || `APP-${(item.id || item._id || 'UNKNOWN').slice(-6)}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="sticky left-[250px] z-10 bg-white px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <p className="text-[12px] font-mono font-bold text-slate-900">{String(item.userId || item.user_id || item.student?.id || item.student?._id || '—')}</p>
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">User ID</p>
                                                                </td>
                                                                <td className="sticky left-[420px] z-10 bg-white px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <p className="text-[13px] text-slate-700 font-medium">{item.email || item.student?.email || '—'}</p>
                                                                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                                                                        <span className="material-symbols-outlined text-[12px]">phone_enabled</span>
                                                                        {item.phone || item.mobile || item.phoneNumber || item.student?.phone || '—'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    {item.universityName || item.college ? (() => {
                                                                        const collegeName = item.universityName || item.college;
                                                                        const slug = collegeName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                                        return (
                                                                            <Link
                                                                                href={`/university/${slug}`}
                                                                                target="_blank"
                                                                                className="text-[16px] font-['Playfair_Display',serif] font-bold text-black hover:text-slate-800 cursor-pointer transition-all block truncate max-w-[180px]"
                                                                                title="Click to view University Details"
                                                                            >
                                                                                {collegeName}
                                                                            </Link>
                                                                        );
                                                                    })() : (
                                                                        <p className="text-[16px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate max-w-[180px]">—</p>
                                                                    )}
                                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">COLLEGE/UNIVERSITY</p>
                                                                </td>
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <p className="text-[16px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate max-w-[120px]">{item.courseName || item.program || item.courseLevel || '—'}</p>
                                                                </td>
                                                                <td className="px-6 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors min-w-[240px] w-[260px]">
                                                                    <div className="flex items-center min-h-[60px]">
                                                                        {(() => {
                                                                            const bName = (item.bank || item.targetBank || '').toLowerCase();
                                                                            if (bName.includes('idfc')) return <img src="/images/lenders/idfc-first-bank.jpg" alt="IDFC FIRST Bank" className="h-12 max-w-[190px] w-auto object-contain" />;
                                                                            if (bName.includes('avanse')) return <img src="/images/lenders/avanse.jpg" alt="Avanse" className="h-14 max-w-[190px] w-auto object-contain" />;
                                                                            if (bName.includes('auxilo')) return <img src="/images/lenders/auxilo.png" alt="Auxilo" className="h-16 max-w-[190px] w-auto object-contain" />;
                                                                            if (bName.includes('credila') || bName.includes('hdfc')) return <img src="/images/lenders/hdfc-credila.png" alt="Credila" className="h-11 max-w-[190px] w-auto object-contain" />;
                                                                            if (bName.includes('poonawalla')) return <img src="/images/lenders/poonawalla.png" alt="Poonawalla" className="h-[52px] max-w-[190px] w-auto object-contain" />;
                                                                            return <div className="text-[#0d1b2a] font-black text-[14px] uppercase truncate max-w-[200px]">{item.bank || item.targetBank || '—'}</div>;
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
                                                                {/* <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex items-center gap-1.5">
                                                                       
                                                                        {[
                                                                            { id: 'id', icon: 'person', label: 'ID', status: progress > 15 ? 'success' : 'pending' },
                                                                            { id: 'ac', icon: 'school', label: 'EDU', status: progress > 40 ? 'success' : 'pending' },
                                                                            { id: 'fi', icon: 'payments', label: 'FIN', status: progress > 70 ? 'success' : 'pending' }
                                                                        ].map(doc => (
                                                                            <div key={doc.id} title={doc.label} className={`w-7 h-7 rounded-lg flex items-center justify-center border ${doc.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                                                <span className="material-symbols-outlined text-[16px]">{doc.icon}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td> */}
                                                                <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex flex-col items-start gap-1.5">
                                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-wider border ${statusColors[statusKey] || 'bg-amber-50/50 text-amber-600 border-amber-200'}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusKey === 'rejected' ? 'bg-rose-500' : statusKey === 'approved' || statusKey === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                            {item.status || 'DRAFT'}
                                                                        </span>
                                                                        <div className="text-[12px] text-slate-500 font-medium">
                                                                            <p>Submitted: {item.submittedAt ? formatIST(item.submittedAt) : '—'}</p>
                                                                            <p>Now: {formatIST(nowTime)}</p>
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
                                                                                    {/* <button
                                                                                        onClick={() => {
                                                                                            const uid = item.userId || item.user_id || item.student?.id || item.student?._id;
                                                                                            if (uid) window.open(`/staff/users/${uid}`, '_blank');
                                                                                            setActiveMenuId(null);
                                                                                        }}
                                                                                        className="w-full flex items-center gap-4 px-5 py-3 text-[12px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[18px] text-indigo-500">account_circle</span>
                                                                                        View Profile
                                                                                    </button> */}
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
                                                                            {(() => {
                                                                                const isUserOnline = item.email && onlineEmails.map(e => e.toLowerCase()).includes(item.email.toLowerCase());
                                                                                return (
                                                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isUserOnline ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/30' : 'bg-slate-300'}`} title={isUserOnline ? "Online now" : "Offline"} />
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[16px] font-bold text-[#0d1b2a] leading-tight">
                                                                                {item.firstName || '—'} {item.lastName || ''}
                                                                            </p>
                                                                            <p className="text-[12px] text-slate-900 font-bold font-mono mt-1">
                                                                                ID: {item.id || item._id || ''}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <p className="text-[15px] text-slate-700 font-medium">{item.email}</p>
                                                                    <p className="text-[13px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                                                                        <span className="material-symbols-outlined text-[12px]">phone_enabled</span>
                                                                        {item.phone || item.mobile || item.phoneNumber || '—'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider border ${roleInfo.color}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                                                                        {roleInfo.label}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {item.last_login_at ? (
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5 text-[14px] font-medium text-slate-700">
                                                                                <span className="material-symbols-outlined text-[13px] text-emerald-500">pin_drop</span>
                                                                                {item.last_login_location || 'Unknown location'}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-[12px] text-slate-400">
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
                                                                            <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">Never Logged In</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {(() => {
                                                                        const regTime = item.registeredAtIndia || item.createdAt;
                                                                        if (!regTime) return <span className="text-[12px] font-mono text-slate-400">NO_RECORD</span>;

                                                                        try {
                                                                            if (typeof regTime === 'string' && regTime.endsWith(' IST')) {
                                                                                const parts = regTime.split(' ');
                                                                                if (parts.length >= 2) {
                                                                                    const datePart = parts[0]; // "YYYY-MM-DD"
                                                                                    const timePart = parts[1]; // "HH:MM:SS"
                                                                                    const ymd = datePart.split('-');
                                                                                    const hms = timePart.split(':');
                                                                                    if (ymd.length === 3 && hms.length >= 2) {
                                                                                        const year = parseInt(ymd[0], 10);
                                                                                        const month = parseInt(ymd[1], 10) - 1;
                                                                                        const day = parseInt(ymd[2], 10);
                                                                                        const hours = parseInt(hms[0], 10);
                                                                                        const minutes = parseInt(hms[1], 10);

                                                                                        const dateObj = new Date(year, month, day, hours, minutes);
                                                                                        return (
                                                                                            <>
                                                                                                <p className="text-[14px] font-semibold text-slate-800">{format(dateObj, 'MMM d, yyyy').toUpperCase()}</p>
                                                                                                <p className="text-[12px] text-slate-400 mt-0.5">{format(dateObj, 'hh:mm aa')}</p>
                                                                                            </>
                                                                                        );
                                                                                    }
                                                                                }
                                                                            }

                                                                            const dateObj = convertToIST(regTime);
                                                                            if (!isNaN(dateObj.getTime())) {
                                                                                return (
                                                                                    <>
                                                                                        <p className="text-[14px] font-semibold text-slate-800">{format(dateObj, 'MMM d, yyyy').toUpperCase()}</p>
                                                                                        <p className="text-[12px] text-slate-400 mt-0.5">{format(dateObj, 'hh:mm aa')}</p>
                                                                                    </>
                                                                                );
                                                                            }
                                                                        } catch (e) {
                                                                            console.error('[User Directory registered formatting error]', e);
                                                                        }
                                                                        return <span className="text-[13px] font-semibold text-slate-800">{regTime}</span>;
                                                                    })()}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                const uid = item.id || item._id;
                                                                                const email = item.email;
                                                                                const params = new URLSearchParams();
                                                                                if (email) params.append('email', email);
                                                                                const queryStr = params.toString();
                                                                                window.open(`/staff/users/${uid}${queryStr ? `?${queryStr}` : ''}`, '_blank');
                                                                            }}
                                                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
                                                                            title="View Profile"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setAutoStartUser(item); navigateToSection("chat_customer"); }}
                                                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
                                                                            title="Direct Message"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
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
                                {((activeSection === 'users' && totalItems > itemsPerPage) || activeSection === 'applications') && (
                                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex flex-col">
                                            {/* <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Navigation Console</p> */}
                                            <p className="text-[11px] font-bold text-slate-700">
                                                Page <span className="text-indigo-600">{currentPage}</span> of {totalPages}
                                                <span className="mx-2 text-slate-300">|</span>
                                                Total Records: <span className="text-slate-900">{activeSection === 'applications' ? appsTotalItems : totalItems}</span>
                                                {activeSection === 'applications' && (
                                                    <span className="ml-2 text-slate-400"> &bull; Showing {showingStart}&ndash;{showingEnd}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={currentPage === 1 || loading}
                                                onClick={() => {
                                                    navigateToPage(currentPage - 1);
                                                }}
                                                className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm"
                                                title="Previous page"
                                                aria-label="Previous page"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                            </button>
                                            <div className="flex items-center gap-1 mx-2">
                                                {(() => {
                                                    const pages: number[] = [];
                                                    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                                                    else {
                                                        pages.push(1);
                                                        if (currentPage > 3) pages.push(-1);
                                                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                                        if (currentPage < totalPages - 2) pages.push(-2);
                                                        pages.push(totalPages);
                                                    }
                                                    return pages.map((pageNum, i) => pageNum < 0 ? (
                                                        <span key={`ellipsis-${i}`} className="text-slate-400 text-[10px] font-black px-1">...</span>
                                                    ) : (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => navigateToPage(pageNum)}
                                                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ));
                                                })()}
                                            </div>
                                            <button
                                                disabled={currentPage >= totalPages || loading}
                                                onClick={() => {
                                                    navigateToPage(currentPage + 1);
                                                }}
                                                className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm"
                                                title="Next page"
                                                aria-label="Next page"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                                            <div className="text-right shrink-0">
                                                <span className="text-[11px] text-slate-400 font-medium block">{a.time}</span>
                                                {(a.createdAt || a.rawTime) && (
                                                    <span className="text-[10px] text-slate-300 flex items-center gap-1 justify-end mt-0.5">
                                                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                        {formatAbsoluteDateTime(a.createdAt || a.rawTime)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main >

            {selectedApp && (
                <ApplicationDetailView
                    application={selectedApp}
                    onBack={() => setSelectedApp(null)}
                    onAadhaarSaved={(aadhaarNumber) => {
                        const appUserId = selectedApp.userId || selectedApp.applicantId;
                        const onboardUserId = createdUser?.id || createdUser?.uid || createdUser?._id;
                        if (appUserId && appUserId === onboardUserId) {
                            setNewStudent(prev => ({ ...prev, aadhaarNumber }));
                        }
                    }}
                />
            )
            }

            <PullDocumentsModal
                isOpen={showPullModal}
                onClose={() => setShowPullModal(false)}
            />

            {/* Document Preview Modal / Right Side-Drawer */}
            {previewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-300" onClick={() => setPreviewDoc(null)}>
                    <div
                        className="w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Document Vault Viewer</span>
                                <h3 className="text-lg font-bold font-['Playfair_Display',serif] text-slate-900 mt-0.5">{previewDoc.name}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={previewDoc.url}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center"
                                    title="Open / Download Full File"
                                >
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-slate-100/40 p-8 flex items-center justify-center overflow-auto">
                            {previewDoc.url.toLowerCase().includes('.pdf') ||
                                previewDoc.name.toLowerCase().includes('pdf') ||
                                !/\.(jpg|jpeg|png|webp|gif)/i.test(previewDoc.url.split('?')[0]) ? (
                                <iframe
                                    src={previewDoc.url}
                                    className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-xl"
                                    title={previewDoc.name}
                                />
                            ) : (
                                <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl bg-white p-4 border border-slate-200">
                                    <img
                                        src={previewDoc.url}
                                        alt={previewDoc.name}
                                        className="max-w-full max-h-[70vh] object-contain rounded-xl"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Interactive Document Upload Modal Popup */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-300 font-['Plus_Jakarta_Sans',sans-serif]">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Header Section */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-white shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-600 text-2xl">cloud_upload</span>
                                    Upload Documents
                                </h3>
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all border border-slate-100 hover:scale-105"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            {/* Simplified Info Banner */}
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span className="material-symbols-outlined text-indigo-600 text-[18px]">verified_user</span>
                                <span>Primary identity & KYC documents are required for background verification.</span>
                            </div>
                        </div>

                        {/* Split-Screen Main Content Body */}
                        <div className="flex-1 overflow-hidden flex min-h-0">
                            {/* LEFT SIDEBAR PANEL: Interactive Documents List */}
                            <div className="w-5/12 bg-slate-50/50 border-r border-slate-100 flex flex-col min-h-0">
                                <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">folder_special</span>
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Document Vault Workspace</span>
                                </div>

                                {/* Dynamic Document Items List */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-slate-50/30">
                                    {(() => {
                                        const groups = [
                                            {
                                                title: "Student KYC & Identity",
                                                icon: "fingerprint",
                                                items: getStudentDocumentRequirements(newStudent).filter(d => ['passport', 'national_id', 'pan'].includes(d.type)),
                                                category: 'applicant' as const
                                            },
                                            {
                                                title: "Student Academic Docs",
                                                icon: "school",
                                                items: getStudentDocumentRequirements(newStudent).filter(d => ['marksheet_10', 'marksheet_12', 'ug_transcript', 'ug_degree', 'pg_transcript', 'pg_degree', 'english_test', 'aptitude_test', 'resume', 'work_letters'].includes(d.type)),
                                                category: 'applicant' as const
                                            },
                                            {
                                                title: `${newStudent.family.fatherName || "Father"}'s Documents`,
                                                icon: "hail",
                                                items: getProfileDocumentRequirements(newStudent).filter(d => d.type.startsWith('father_')),
                                                category: 'father' as const
                                            },
                                            {
                                                title: `${newStudent.family.motherName || "Mother"}'s Documents`,
                                                icon: "woman",
                                                items: getProfileDocumentRequirements(newStudent).filter(d => d.type.startsWith('mother_')),
                                                category: 'mother' as const
                                            },
                                            {
                                                title: `${newStudent.coApplicant.name || "Co-applicant"}'s Documents`,
                                                icon: "group",
                                                items: getProfileDocumentRequirements(newStudent).filter(d => d.type.startsWith('coapplicant_')),
                                                category: 'coapplicant' as const
                                            }
                                        ];

                                        return groups.map((g, gIdx) => {
                                            if (g.items.length === 0) return null;

                                            return (
                                                <div key={gIdx} className="space-y-3">
                                                    <div className="flex items-center gap-1.5 px-1 py-1 shrink-0">
                                                        <span className="material-symbols-outlined text-slate-400 text-[15px]">{g.icon}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{g.title}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {g.items.map((doc, idx) => {
                                                            const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                            const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                                            const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));
                                                            const isActive = selectedDocType === doc.type;

                                                            let helper = "Required KYC / financial document";
                                                            if (doc.type === 'passport' || doc.type === 'national_id' || doc.type === 'pan') helper = "Fills identity and compliance details";
                                                            else if (doc.type === 'marksheet_10' || doc.type === 'marksheet_12' || doc.type === 'marksheet_ug' || doc.type === 'marksheet_pg') helper = "Fills fields of Academic qualifications";
                                                            else if (doc.type === 'resume') helper = "Fills fields of Work Experience Details";
                                                            else if (doc.type === 'english_test') helper = "Fills selected Tests Details";

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        setSelectedDocType(doc.type);
                                                                        setSelectedDocName(doc.name);
                                                                        setSelectedDocCategory(g.category);
                                                                    }}
                                                                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${isActive
                                                                        ? 'bg-white border-indigo-600 shadow-md shadow-indigo-600/5'
                                                                        : isUploaded
                                                                            ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200'
                                                                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                                                                        }`}
                                                                >
                                                                    {isActive && (
                                                                        <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-indigo-600 z-10" />
                                                                    )}

                                                                    <div className="pr-1">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div>
                                                                                <h4 className="text-[11px] font-bold text-slate-800 leading-tight">{doc.name}</h4>
                                                                                <p className="text-[8px] text-slate-400 font-semibold mt-0.5 leading-normal">{helper}</p>
                                                                            </div>
                                                                            {isUploaded && (
                                                                                <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/10">
                                                                                    <span className="material-symbols-outlined text-[10px] font-black">check</span>
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {isUploaded && existingDoc && (
                                                                            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-dashed border-slate-100 text-[8px] font-black uppercase tracking-wider" onClick={(e) => e.stopPropagation()}>
                                                                                <button
                                                                                    onClick={() => viewFile(doc.type)}
                                                                                    className="text-red-500 hover:text-red-600 hover:underline flex items-center gap-0.5 leading-none"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[11px] font-black">description</span>
                                                                                    Review File
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDocumentDelete(doc.type, g.category, doc.name)}
                                                                                    className="text-slate-400 hover:text-rose-600 flex items-center gap-0.5 transition-colors leading-none"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[12px]">delete</span>
                                                                                    Remove
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        {doc.type === 'english_test' && (
                                                                            <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                                                                                <div className="relative">
                                                                                    <select
                                                                                        value={selectedTestType}
                                                                                        onChange={(e) => setSelectedTestType(e.target.value)}
                                                                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-7 text-[9px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                                                                    >
                                                                                        <option value="Select Test">Select Test</option>
                                                                                        <option value="IELTS">IELTS</option>
                                                                                        <option value="TOEFL">TOEFL</option>
                                                                                        <option value="PTE">PTE Academic</option>
                                                                                        <option value="Duolingo">Duolingo Test</option>
                                                                                    </select>
                                                                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[12px]">expand_more</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* RIGHT CONTENT PANEL: Active Upload Zone & Instructions */}
                            {(() => {
                                const docType = selectedDocType;
                                const personType = selectedDocCategory;
                                const uploadKey = `${docType}-${personType}`;
                                const isUploading = uploadingDocs[uploadKey] !== undefined;
                                const uploadProgress = uploadingDocs[uploadKey] ?? 0;
                                const uploadError = uploadErrors[uploadKey];
                                const uploadFeedback = uploadMessages[uploadKey];
                                const autofillFeedback = autofillMessages[uploadKey];

                                const existingDoc = userDocuments.find(ud => ud.docType === docType || ud.type === docType);
                                const existingStatus = String(existingDoc?.status || "").toLowerCase();
                                const isUploaded = Boolean(existingDoc?.uploaded || ["uploaded", "verified"].includes(existingStatus));

                                let personName = newStudent.firstName + ' ' + newStudent.lastName;
                                let employmentType = undefined;
                                if (personType === 'father') {
                                    personName = newStudent.family.fatherName || 'Father';
                                    employmentType = newStudent.family.fatherEmploymentType;
                                } else if (personType === 'mother') {
                                    personName = newStudent.family.motherName || 'Mother';
                                    employmentType = newStudent.family.motherEmploymentType;
                                } else if (personType === 'coapplicant') {
                                    personName = newStudent.coApplicant.name || 'Co-applicant';
                                    employmentType = newStudent.coApplicant.employmentType;
                                }

                                let customInstruction = "Merge the front and back pages of student's Passport and upload it as a single file.";
                                if (docType.includes('marksheet')) {
                                    customInstruction = `Provide all semesters / consolidated marksheet copies for student's ${selectedDocName}.`;
                                } else if (docType === 'resume') {
                                    customInstruction = "Upload student's detailed CV covering academics, projects and work milestones.";
                                } else if (docType.includes('pan')) {
                                    customInstruction = "Provide clear scanned copy of PAN Card with legible signature and photograph.";
                                } else if (docType.includes('aadhar')) {
                                    customInstruction = "Merge the front side and back side of Aadhaar card into a single PDF or image file.";
                                }

                                return (
                                    <div className="w-7/12 p-8 flex flex-col justify-between overflow-y-auto no-scrollbar bg-white">
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                                    {personType.toUpperCase()} - {selectedDocName}
                                                </span>
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight mt-2">{selectedDocName} Workspace</h4>
                                                <p className="text-xs text-slate-400 font-semibold mt-1">Upload, review and verify metadata using premium AI extraction.</p>
                                            </div>

                                            {(uploadFeedback || uploadError) && (
                                                <div
                                                    className={`rounded-2xl px-4 py-3 text-xs font-bold border animate-in fade-in slide-in-from-top-2 duration-200 ${uploadFeedback?.type === 'success'
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        : uploadFeedback?.type === 'warning'
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        }`}
                                                >
                                                    {uploadFeedback?.text || uploadError}
                                                </div>
                                            )}

                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                ref={el => {
                                                    if (el) fileInputRefs.current[`modal-${uploadKey}`] = el;
                                                }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        await handleDocumentUpload(file, docType, personType, personName, employmentType);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                hidden
                                            />

                                            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-8 text-center transition-all bg-slate-50/50 flex flex-col items-center justify-center min-h-[220px]">
                                                {isUploaded && existingDoc ? (
                                                    <div className="space-y-4 animate-in fade-in duration-300">
                                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-md shadow-emerald-500/5 mx-auto">
                                                            <span className="material-symbols-outlined text-[32px] font-black">check</span>
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-800 tracking-tight">{existingDoc.fileName || existingDoc.filename || `${selectedDocName}.pdf`}</h5>
                                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Upload Complete</p>
                                                            {uploadFeedback && (
                                                                <p className={`text-[10px] font-bold mt-2 max-w-sm mx-auto px-3 py-1.5 rounded-lg border ${uploadFeedback.type === 'success'
                                                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                                                    : uploadFeedback.type === 'warning'
                                                                        ? 'text-amber-700 bg-amber-50 border-amber-100'
                                                                        : 'text-rose-700 bg-rose-50 border-rose-100'
                                                                    }`}>
                                                                    {uploadFeedback.text}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-3 justify-center pt-2">
                                                            <button
                                                                onClick={() => viewFile(docType)}
                                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-50 hover:shadow-sm transition-all flex items-center gap-1.5"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                Review File
                                                            </button>
                                                            <button
                                                                onClick={() => fileInputRefs.current[`modal-${uploadKey}`]?.click()}
                                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold hover:shadow-sm transition-all flex items-center gap-1.5"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">replay</span>
                                                                Re-upload
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : isUploading ? (
                                                    <div className="space-y-4 animate-in fade-in duration-200">
                                                        <div className="relative w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin mx-auto flex items-center justify-center" />
                                                        <div>
                                                            <h5 className="text-xs font-bold text-slate-800">Uploading File...</h5>
                                                            <p className="text-[11px] font-bold text-indigo-600 mt-1">{Math.round(uploadProgress)}% Complete</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => fileInputRefs.current[`modal-${uploadKey}`]?.click()}
                                                        className="space-y-4 cursor-pointer hover:scale-[1.01] transition-transform duration-200 w-full py-4"
                                                    >
                                                        <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                                                            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">Drag & drop student file here, or <span className="text-indigo-600 hover:underline">browse</span></p>
                                                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Supports PDF, JPG, PNG files up to 5MB</p>
                                                        </div>
                                                        {uploadError && (
                                                            <p className="text-[10px] text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-md border border-rose-100 max-w-xs mx-auto">{uploadError}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">info</span>
                                                    Instructions:
                                                </h5>
                                                <ul className="text-[11px] text-slate-500 font-semibold space-y-2.5 list-disc pl-5 leading-relaxed">
                                                    <li>{customInstruction}</li>
                                                    <li>Maximum 2 successful file uploads per document</li>
                                                    <li>This functionality supports only .jpg, .png, and .pdf files.</li>
                                                    <li>This functionality supports files up to 5 MB.</li>
                                                    <li>This functionality supports one file at a time.</li>
                                                    <li>If you remove the document, you will lose the information in the corresponding section.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {autofillFeedback && (
                                            <div
                                                className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold border animate-in fade-in duration-200 ${autofillFeedback.type === 'success'
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}
                                            >
                                                {autofillFeedback.text}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!isUploaded || !existingDoc) {
                                                    setAutofillMessages(prev => ({
                                                        ...prev,
                                                        [uploadKey]: { type: 'error', text: 'Please upload the document first before using Autofill.' },
                                                    }));
                                                    return;
                                                }
                                                const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
                                                if (!userId) return;

                                                const meta = existingDoc.verificationMetadata || existingDoc.metadata;
                                                let extractedFields = meta?.details?.extractedFields || meta?.extractedFields || meta?.ocrResult?.extractedFields;

                                                if ((!extractedFields || Object.keys(extractedFields).length === 0) && ocrResults[uploadKey]) {
                                                    extractedFields = ocrResults[uploadKey];
                                                }

                                                if (!extractedFields || Object.keys(extractedFields).length === 0) {
                                                    try {
                                                        const res: any = await documentApi.ocrReverify(userId, docType);
                                                        extractedFields = res?.data?.extractedFields || res?.data?.ocrResult?.extractedFields;
                                                        if (extractedFields && Object.keys(extractedFields).length > 0) {
                                                            await fetchUserDocuments(userId);
                                                        }
                                                    } catch (err: any) {
                                                        setAutofillMessages(prev => ({
                                                            ...prev,
                                                            [uploadKey]: {
                                                                type: 'error',
                                                                text: `OCR extraction failed: ${err?.message || 'Could not read document. Please re-upload a clear image.'}`,
                                                            },
                                                        }));
                                                        return;
                                                    }
                                                }

                                                if (extractedFields && Object.keys(extractedFields).length > 0) {
                                                    const result = await autoFillFromOcr(docType, extractedFields);
                                                    setAutofillMessages(prev => ({
                                                        ...prev,
                                                        [uploadKey]: {
                                                            type: result.filled ? 'success' : 'error',
                                                            text: result.filled ? `✨ ${result.message}` : result.message,
                                                        },
                                                    }));
                                                } else {
                                                    setAutofillMessages(prev => ({
                                                        ...prev,
                                                        [uploadKey]: {
                                                            type: 'error',
                                                            text: 'Could not extract data from this document. Please upload a clearer image or PDF.',
                                                        },
                                                    }));
                                                }
                                            }}
                                            className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">magic_button</span>
                                            Autofill
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
