"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, documentApi, staffProfileApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import ApplicationDetailView from "@/components/staff/ApplicationDetailView";
import { motion, AnimatePresence } from "framer-motion";

// Premium 3D Interactive Card Component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;

        // Subtle 3D perspective rotation (max 5 degrees tilt)
        const rX = -(mouseY / (height / 2)) * 5;
        const rY = (mouseX / (width / 2)) * 5;
        setTilt({ x: rX, y: rY });

        // Glare coordinates
        const glareX = ((e.clientX - rect.left) / width) * 100;
        const glareY = ((e.clientY - rect.top) / height) * 100;
        setGlare({ x: glareX, y: glareY, opacity: 0.15 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setGlare(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`,
                transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            className={`relative overflow-hidden transition-all duration-300 ${className}`}
        >
            {/* Ambient reflective glare */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
                style={{
                    background: `radial-gradient(circle 250px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.5), transparent)`,
                    opacity: glare.opacity,
                }}
            />
            {children}
        </div>
    );
}

export default function StaffUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user } = useAuth();
    const { id: userId } = use(params);
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email');

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [userApplications, setUserApplications] = useState<any[]>([]);
    const [userDocuments, setUserDocuments] = useState<any[]>([]);
    const [staffProfile, setStaffProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"profile" | "applications" | "documents">("profile");
    const [selectedApplication, setSelectedApplication] = useState<any>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedDocForReject, setSelectedDocForReject] = useState<any>(null);
    const [documentRejectionReason, setDocumentRejectionReason] = useState("");

    const handleUpdateUserStatus = async (newStatus: "active" | "rejected") => {
        setActionLoading(true);
        try {
            const res = await adminApi.updateUserStatus(userId, newStatus, newStatus === 'rejected' ? rejectionReason : undefined) as any;
            if (res && res.success) {
                setUserData((prev: any) => ({
                    ...prev,
                    status: newStatus,
                    rejectionReason: newStatus === 'rejected' ? rejectionReason : ""
                }));
                setShowRejectForm(false);
                setRejectionReason("");
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDocumentAction = async (docId: string, action: "accept" | "reject", reason?: string) => {
        setActionLoading(true);
        try {
            const endpoint = action === "accept"
                ? `/api/documents/${docId}/accept`
                : `/api/documents/${docId}/reject`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(action === "reject" ? { rejectionReason: reason } : {})
            });

            if (res.ok) {
                const result = await res.json();
                // Update document in state
                setUserDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === docId || doc._id === docId
                            ? {
                                ...doc,
                                status: action === "accept" ? "verified" : "rejected",
                                rejectionReason: action === "reject" ? reason : undefined,
                                rejectionDate: action === "reject" ? new Date().toISOString() : undefined
                            }
                            : doc
                    )
                );

                if (selectedDocForReject?.id === docId || selectedDocForReject?._id === docId) {
                    setSelectedDocForReject(null);
                    setDocumentRejectionReason("");
                }
            } else {
                console.error("Failed to update document:", await res.text());
            }
        } catch (err) {
            console.error(`Failed to ${action} document:`, err);
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                let foundUser = null;

                // First, try to fetch user directly by ID from the admin endpoint
                try {
                    const directRes = await adminApi.getUserById(userId) as any;
                    if (directRes && (directRes.data || directRes.id)) {
                        foundUser = directRes.data || directRes;
                    }
                } catch (directFetchErr) {
                    console.log("Direct user fetch by ID failed, falling back to search:", directFetchErr);
                }

                // If not found, try to fetch by email if provided
                if (!foundUser && emailParam) {
                    try {
                        const emailRes = await adminApi.getUserProfile(emailParam) as any;
                        if (emailRes && (emailRes.data || emailRes.id)) {
                            foundUser = emailRes.data || emailRes;
                        }
                    } catch (emailFetchErr) {
                        console.log("Email-based user fetch failed:", emailFetchErr);
                    }
                }

                // If still not found, fetch all users and search
                if (!foundUser) {
                    const usersRes = await adminApi.getUsers() as any;
                    foundUser = usersRes.data?.find((u: any) => u.id === userId || u._id === userId);
                }

                if (foundUser) {
                    setUserData(foundUser);

                    // Fetch user's applications
                    const appsRes = await adminApi.getApplications({}) as any;
                    const userApps = appsRes.data?.filter((app: any) =>
                        app.userId === userId || app.user_id === userId || app.applicantId === userId || app.linkedUserId === userId ||
                        app.userId === foundUser.id || app.user_id === foundUser.id || app.applicantId === foundUser.id
                    ) || [];
                    setUserApplications(userApps);

                    // Fetch user's documents
                    try {
                        const docsRes = await documentApi.getUsersDocuments(userId) as any;
                        setUserDocuments(docsRes.data || []);
                    } catch (e) {
                        console.log("Could not fetch documents:", e);
                    }

                    // Fetch staff profile if exists
                    try {
                        const profilesRes = await staffProfileApi.list({ search: userId }) as any;
                        if (profilesRes.data && profilesRes.data.length > 0) {
                            setStaffProfile(profilesRes.data[0]);
                        }
                    } catch (e) {
                        console.log("Could not fetch staff profile:", e);
                    }
                }
            } catch (e) {
                console.error("Error fetching user details:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [userId, emailParam]);

    const handleBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF8FE] font-sans text-slate-800 flex items-center justify-center relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[30%] left-[30%] w-[300px] h-[300px] bg-[#6605c7]/5 rounded-full blur-[80px] animate-pulse" />
                </div>
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-[#6605c7]/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-[#6605c7] border-r-purple-400 rounded-full animate-spin" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#6605c7]/5 rounded-full animate-ping" />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.25em] text-[#6605c7] uppercase animate-pulse">Initializing Secure Vault...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen bg-[#FAF8FE] font-sans text-slate-800 flex items-center justify-center relative">
                <div className="max-w-md w-full mx-6 p-8 rounded-2xl bg-white/70 border border-white/80 backdrop-blur-xl shadow-2xl text-center relative z-10">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <span className="material-symbols-outlined text-[32px]">face_dissatisfied</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1626] mb-2">Subject Decryption Failed</h3>
                    <p className="text-sm text-gray-500 mb-8">The requested user profile could not be located in the active directory node.</p>
                    <button
                        onClick={handleBack}
                        className="w-full py-3 bg-gradient-to-r from-[#6605c7] to-[#8b24e5] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 transition-all duration-300 cursor-pointer"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8FE] font-sans text-slate-800 relative overflow-hidden pb-16">

            {/* Floating glowing color circles and tech-grid aligned with the homepage */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#ede0ff]/50 to-[#f3eaff]/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#fed7aa]/25 to-[#fde8c8]/15 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#fdf6ff]/40 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Main view container */}
            <div className="max-w-6xl mx-auto px-6 pt-10 relative z-10">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">
                    <button
                        onClick={handleBack}
                        className="hover:text-[#6605c7] transition-colors cursor-pointer"
                    >
                        Command Center
                    </button>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-[#6605c7]">Users</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-slate-800">{userData.firstName || "—"} {userData.lastName || ""}</span>
                </div>

                {/* Profile Header Block */}
                <TiltCard className="p-8 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(102,5,199,0.03)] relative overflow-hidden sticky top-6 z-30">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-300 via-[#6605c7]/50 to-orange-300" />

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-20">
                        {/* 3D avatar container */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#6605c7] to-[#8b24e5] rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white text-3xl font-black shadow-lg border-4 border-white relative overflow-hidden">
                                {userData.profilePicture ? (
                                    <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-[40px] opacity-80">person</span>
                                )}
                            </div>
                        </div>

                        {/* Title details */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight cursor-pointer hover:text-indigo-600 hover:underline transition-all inline-block" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                    {userData.firstName || "—"} {userData.lastName || ""}
                                </h1>
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#6605c7]/8 text-[#6605c7] border border-[#6605c7]/15 shadow-sm">
                                    {userData.role?.replace("_", " ") || "USER"}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-5 text-xs font-semibold text-gray-700">
                                <div className="flex items-center gap-1.5 font-mono bg-white/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                    <span className="material-symbols-outlined text-[16px] text-[#6605c7]">fingerprint</span>
                                    <span className="text-[9px] text-gray-500 uppercase font-black">ID:</span>
                                    <span className="text-slate-800 select-all font-bold" title={userId}>{userId}</span>
                                </div>
                                {(userData.createdAt || userData.created_at) && (
                                    <div className="flex items-center gap-1.5 font-mono bg-white/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px] text-purple-500">schedule</span>
                                        <span className="text-[9px] text-gray-500 uppercase font-black">Registered:</span>
                                        <span className="text-slate-800 font-bold">
                                            {new Date(userData.createdAt || userData.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TiltCard>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 mt-10 gap-2 relative">
                    {[
                        { id: "profile", label: "Profile Dossier", icon: "badge" },
                        { id: "applications", label: "Applications Node", icon: "description", count: userApplications.length },
                        { id: "documents", label: "Secure Vault Documents", icon: "folder", count: userDocuments.length },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-4 px-4 font-black text-[11px] uppercase tracking-wider relative flex items-center gap-2 transition-all duration-300 cursor-pointer ${isActive ? "text-[#6605c7] opacity-100" : "text-gray-500 hover:text-gray-800 opacity-80"}`}
                            >
                                <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>{tab.icon}</span>
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border transition-all duration-300 ${isActive ? "bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20" : "bg-gray-100 text-gray-600 border-transparent"}`}>
                                        {tab.count}
                                    </span>
                                )}
                                {tab.id === 'applications' && userApplications.length > 0 && (
                                    <span className={`w-2 h-2 rounded-full shadow-sm absolute top-0 right-2 animate-pulse ${userApplications.some(app => app.status === 'processing' || app.status === 'pending') ? 'bg-amber-500' : userApplications.some(app => app.status === 'rejected') ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#6605c7] to-[#8b24e5] shadow-[0_1px_4px_rgba(102,5,199,0.2)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Dynamic Content Grid */}
                <div className="mt-8">
                    <AnimatePresence mode="wait">
                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Personal Information Glass-Card */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
                                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                            <span className="material-symbols-outlined">person</span>
                                            Student Profile - Personal & Academic Details
                                        </h2>

                                        <div className="grid grid-cols-2 gap-6">
                                            {[
                                                { label: "First Name", value: userData.firstName },
                                                { label: "Last Name", value: userData.lastName },
                                                { label: "Email", value: userData.email, lowercase: true },
                                                { label: "Phone", value: userData.phoneNumber || userData.mobile || userData.phone },
                                                { label: "Date of Birth", value: userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "" },
                                                { label: "Nationality", value: userData.nationality?.name || (typeof userData.nationality === 'string' ? userData.nationality : '') || "Indian" },
                                                { label: "Study Destination", value: userData.studyDestination, uppercase: true },
                                                { label: "Target Intake", value: userData.intakeSeason },
                                                { label: "Current Address", value: userData.permanentAddress || userData.address, fullWidth: true },
                                                { label: "College/University Name", value: userData.targetUniversity || userData.universityName || userData.university },
                                                { label: "Course Name", value: userData.courseName },
                                                { label: "Access Privilege", value: userData.role, capitalize: true },
                                            ].map((item, idx) => (
                                                <div key={idx} className={item.fullWidth ? "col-span-2" : ""}>
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                                                    <p className={`text-[14px] font-semibold text-slate-900 ${item.lowercase ? "lowercase" : item.capitalize ? "capitalize" : item.uppercase ? "uppercase" : ""}`}>
                                                        {item.value || "—"}
                                                    </p>
                                                </div>
                                            ))}
                                            {/* <div className="relative p-4 rounded-xl bg-white/30 border border-white/50 hover:bg-white/50 hover:border-white/80 transition-all duration-300 md:col-span-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Profile Verification Status</p>
                                                
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        {userData.status === 'active' || userData.status === 'approved' ? (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/8 text-emerald-600 border border-emerald-500/20 shadow-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Profile Accepted
                                                            </div>
                                                        ) : userData.status === 'rejected' ? (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/8 text-rose-600 border border-rose-500/20 shadow-sm w-fit">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    Profile Rejected
                                                                </div>
                                                                {userData.rejectionReason && (
                                                                    <p className="text-xs text-rose-500 font-bold mt-1">
                                                                        Reason: <span className="font-medium text-gray-600">{userData.rejectionReason}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/8 text-amber-600 border border-amber-500/20 shadow-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                Pending Verification
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {userData.status !== 'active' && userData.status !== 'approved' && !showRejectForm && (
                                                            <button
                                                                onClick={() => handleUpdateUserStatus('active')}
                                                                disabled={actionLoading}
                                                                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                Accept Profile
                                                            </button>
                                                        )}
                                                        {userData.status !== 'rejected' && !showRejectForm && (
                                                            <button
                                                                onClick={() => setShowRejectForm(true)}
                                                                disabled={actionLoading}
                                                                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                                Reject Profile
                                                            </button>
                                                        )}
                                                        {userData.status === 'rejected' && !showRejectForm && (
                                                            <button
                                                                onClick={() => handleUpdateUserStatus('active')}
                                                                disabled={actionLoading}
                                                                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                Re-Accept Profile
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {showRejectForm && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Provide Rejection Reason</label>
                                                        <textarea
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                            placeholder="Type why this profile was rejected (e.g. invalid document uploads, mismatched details, fake phone number)..."
                                                            className="w-full p-3 bg-white/50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none min-h-[70px] placeholder:text-gray-400 placeholder:font-medium"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button
                                                                onClick={() => {
                                                                    setShowRejectForm(false);
                                                                    setRejectionReason("");
                                                                }}
                                                                disabled={actionLoading}
                                                                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateUserStatus('rejected')}
                                                                disabled={actionLoading || !rejectionReason.trim()}
                                                                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Confirm Rejection
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div> */}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Panel */}
                                <div className="space-y-4">
                                    {[
                                        { label: "Applications Node", val: userApplications.length, icon: "description", color: "from-[#6605c7]/10 to-[#6605c7]/5", border: "hover:border-[#6605c7]/30", text: "text-[#6605c7]" },
                                        { label: "Stored Documents", val: userDocuments.length, icon: "folder", color: "from-[#8b24e5]/10 to-[#8b24e5]/5", border: "hover:border-[#8b24e5]/30", text: "text-[#8b24e5]" }
                                    ].map((stat, i) => (
                                        <TiltCard key={i} className="p-6 rounded-2xl bg-white/60 border border-white/80 shadow-md">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                                    <p className="text-4xl font-extrabold text-[#1a1626]">{stat.val}</p>
                                                </div>
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center border border-white/40`}>
                                                    <span className={`material-symbols-outlined text-[24px] ${stat.text}`}>{stat.icon}</span>
                                                </div>
                                            </div>
                                        </TiltCard>
                                    ))}

                                    <TiltCard className="p-6 rounded-2xl bg-white/60 border border-white/80 shadow-md">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Member Since</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-white/40">
                                                <span className="material-symbols-outlined text-[20px] text-gray-400">calendar_today</span>
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-bold text-[#1a1626]">
                                                    {(userData.createdAt || userData.created_at) ? new Date(userData.createdAt || userData.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' }) : "—"}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Secure Access Node</p>
                                            </div>
                                        </div>
                                    </TiltCard>
                                </div>
                            </motion.div>
                        )}

                        {/* Applications Tab */}
                        {activeTab === "applications" && (
                            <motion.div
                                key="applications"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                {!selectedApplication ? (
                                    <div className="bg-white/60 border border-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                                        {userApplications.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 bg-white/20">
                                                            {["Application ID", "Bank Node", "Loan Program", "Status", "Timestamp", "Action"].map((header, idx) => (
                                                                <th key={idx} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {userApplications.map((app, idx) => {
                                                            const statusStyle = app.status === "approved"
                                                                ? "bg-emerald-500/8 text-emerald-600 border-emerald-500/20"
                                                                : app.status === "rejected"
                                                                    ? "bg-rose-500/8 text-rose-600 border-rose-500/20"
                                                                    : app.status === "processing"
                                                                        ? "bg-indigo-500/8 text-indigo-600 border-indigo-500/20"
                                                                        : "bg-amber-500/8 text-amber-600 border-amber-500/20";

                                                            return (
                                                                <tr key={idx} className="hover:bg-white/30 transition-colors duration-200">
                                                                    <td className="px-6 py-4 text-xs font-mono font-bold text-[#6605c7]" title={app.id}>
                                                                        {app.applicationNumber || `APP${app.id?.replace(/-/g, "").slice(-10).toUpperCase()}`}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-xs font-semibold text-gray-700">{app.bank || "—"}</td>
                                                                    <td className="px-6 py-4 text-xs font-semibold text-gray-700">{app.loanType || "—"}</td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyle}`}>
                                                                            <span className={`w-1 h-1 rounded-full ${app.status === "approved" ? "bg-emerald-500 animate-pulse" : app.status === "rejected" ? "bg-rose-500" : app.status === "processing" ? "bg-indigo-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                                                                            {app.status || "Pending"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                                        {formatDate(app.createdAt, "MMM d, yyyy")}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <button
                                                                            onClick={() => setSelectedApplication(app)}
                                                                            className="w-8 h-8 rounded-lg bg-white border border-gray-100 hover:bg-[#6605c7]/10 hover:border-[#6605c7]/20 text-gray-400 hover:text-[#6605c7] flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm"
                                                                            title="View Details"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="py-16 text-center">
                                                <span className="material-symbols-outlined text-[48px] text-slate-400 mx-auto block mb-4 animate-bounce" style={{ animationDuration: '3s' }}>inbox</span>
                                                <p className="text-gray-500 font-semibold text-sm">No applications found in directory</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-white/70 border border-white/80 p-4">
                                        <ApplicationDetailView
                                            application={selectedApplication}
                                            onBack={() => setSelectedApplication(null)}
                                            onAadhaarSaved={(aadhaarNumber) => {
                                                setUserData((prev: any) => ({ ...prev, aadhaarNumber }));
                                            }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === "documents" && (
                            <motion.div
                                key="documents"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                            >
                                {userDocuments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {userDocuments.map((doc, idx) => (
                                            <TiltCard key={idx} className={`border rounded-2xl p-6 backdrop-blur-xl shadow-md hover:shadow-xl transition-all duration-300 relative group/doc flex flex-col h-full ${doc.status === 'verified'
                                                ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                                                : 'bg-white/60 border-white/80 hover:shadow-xl'
                                                }`}>
                                                {/* Locked indicator for accepted documents */}
                                                {doc.status === 'verified' && (
                                                    <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg z-20" title="Document is locked and cannot be changed">
                                                        <span className="material-symbols-outlined text-[16px]">lock</span>
                                                    </div>
                                                )}

                                                {/* Bottom accent border matching status */}
                                                <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-b-2xl transition-all duration-300 opacity-60 group-hover/doc:opacity-100 ${doc.status === 'uploaded' || doc.status === 'verified'
                                                    ? 'bg-emerald-500'
                                                    : doc.status === 'rejected'
                                                        ? 'bg-rose-500'
                                                        : 'bg-amber-500'
                                                    }`} />

                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors duration-300 ${doc.status === 'verified'
                                                        ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                                                        : 'bg-gray-50 border-gray-100 text-gray-400 group-hover/doc:text-[#6605c7] group-hover/doc:bg-[#6605c7]/10'
                                                        }`}>
                                                        <span className="material-symbols-outlined text-[22px]">{doc.status === 'verified' ? 'check_circle' : 'description'}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-black text-[#1a1626] uppercase tracking-wider truncate">{doc.docType || doc.type || "Document"}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5">{doc.fileName || "No attachment"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4 mb-4 text-[9px] font-bold text-gray-400 font-mono">
                                                    <div>
                                                        {doc.uploadedAt ? (
                                                            <p className="uppercase tracking-wider">
                                                                Uploaded: {formatDate(doc.uploadedAt, "MMM d, yyyy")}
                                                            </p>
                                                        ) : (
                                                            <p className="uppercase tracking-wider">No timestamp</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${doc.status === 'uploaded' || doc.status === 'verified'
                                                        ? 'bg-emerald-500/8 text-emerald-600 border-emerald-500/20'
                                                        : doc.status === 'rejected'
                                                            ? 'bg-rose-500/8 text-rose-600 border-rose-500/20'
                                                            : 'bg-amber-500/8 text-[#d97706] border-amber-500/20'
                                                        }`}>
                                                        {doc.status === 'verified' ? 'Accepted' : doc.status || 'pending'}
                                                    </span>
                                                </div>

                                                {/* Document rejection reason display */}
                                                {doc.status === 'rejected' && (doc.verificationMetadata?.rejectionReason || doc.rejectionReason) && (
                                                    <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mb-1">Rejection Reason</p>
                                                        <p className="text-[10px] text-rose-700 font-semibold">{doc.verificationMetadata?.rejectionReason || doc.rejectionReason}</p>
                                                    </div>
                                                )}

                                                {/* Accepted date display for verified documents */}
                                                {doc.status === 'verified' && (
                                                    <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Acceptance Status</p>
                                                        <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                            Document has been permanently accepted
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Document view button - disabled for accepted documents */}
                                                {doc.filePath && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const token = typeof window !== 'undefined'
                                                                    ? (localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken'))
                                                                    : null;

                                                                // Use absolute /api route to ensure it's proxied to NestJS
                                                                const res = await fetch(`/api/documents/presigned-view/${userId}/${encodeURIComponent(doc.docType)}`, {
                                                                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                                                                });
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    window.open(data.url, '_blank');
                                                                } else {
                                                                    // Direct streaming view backup route
                                                                    window.open(`/api/documents/view/${userId}/${encodeURIComponent(doc.docType)}`, '_blank');
                                                                }
                                                            } catch (e) {
                                                                console.error('Failed to open document:', e);
                                                            }
                                                        }}
                                                        disabled={doc.status === 'verified'}
                                                        className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 mb-3 shadow-md ${doc.status === 'verified'
                                                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                            : 'text-white bg-gradient-to-r from-[#6605c7] to-[#8b24e5] hover:opacity-90 cursor-pointer shadow-[#6605c7]/15 hover:shadow-[#6605c7]/25'
                                                            }`}
                                                        title={doc.status === 'verified' ? 'Cannot modify accepted documents' : 'View document'}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                        {doc.status === 'verified' ? 'Locked' : 'Stream Decrypted Doc'}
                                                    </button>
                                                )}

                                                {/* Accept/Reject buttons */}
                                                <div className="flex gap-2 mt-auto">
                                                    {doc.status === 'uploaded' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDocumentAction(doc.id || doc._id, "accept")}
                                                                disabled={actionLoading}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                                                                title="Accept this document (cannot be changed once accepted)"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedDocForReject(doc)}
                                                                disabled={actionLoading}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm shadow-rose-500/20"
                                                                title="Reject this document"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {doc.status === 'verified' && (
                                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider text-center w-full py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                            <span className="material-symbols-outlined text-[12px] align-middle mr-1">lock</span>
                                                            Document Locked
                                                        </div>
                                                    )}
                                                    {doc.status === 'rejected' && (
                                                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-wider text-center w-full">
                                                            Document Rejected
                                                        </div>
                                                    )}
                                                </div>
                                            </TiltCard>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-white/40 border border-white/60 rounded-2xl shadow-sm backdrop-blur-sm">
                                        <div className="w-24 h-24 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <span className="material-symbols-outlined text-[48px] text-indigo-300">file_copy</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2">No Documents Found</h3>
                                        <p className="text-gray-500 font-medium text-sm mb-8 max-w-md mx-auto">This student hasn't uploaded any documents to their secure vault yet.</p>
                                        {/* <div className="flex items-center justify-center gap-4">
                                            <button
                                                className="px-6 py-2.5 bg-gradient-to-r from-[#6605c7] to-[#8b24e5] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                                onClick={() => alert("Upload functionality to be implemented")}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                                Upload Document
                                            </button>
                                            <button
                                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                                                onClick={() => alert("Request functionality to be implemented")}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">send</span>
                                                Request Files
                                            </button>
                                        </div> */}
                                    </div>
                                )}

                                {/* Document Rejection Modal */}
                                {selectedDocForReject && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/40"
                                        >
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border-b border-rose-200 px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
                                                        <span className="material-symbols-outlined text-[20px]">block</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[13px] font-black text-[#1a1626] uppercase tracking-wider">Reject Document</h3>
                                                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{selectedDocForReject.docType || selectedDocForReject.type || "Document"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
                                                    Provide Rejection Reason
                                                </label>
                                                <textarea
                                                    value={documentRejectionReason}
                                                    onChange={(e) => setDocumentRejectionReason(e.target.value)}
                                                    placeholder="Example: Document is unclear, expired, or doesn't match user details. Image quality is poor, handwriting is illegible, or critical information is missing..."
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none min-h-[100px] placeholder:text-gray-400 placeholder:font-medium placeholder:text-[10px]"
                                                />
                                                <p className="text-[9px] text-gray-400 font-medium mt-2">The user will see this reason and can resubmit with corrections.</p>
                                            </div>

                                            {/* Footer */}
                                            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocForReject(null);
                                                        setDocumentRejectionReason("");
                                                    }}
                                                    disabled={actionLoading}
                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDocumentAction(
                                                            selectedDocForReject.id || selectedDocForReject._id,
                                                            "reject",
                                                            documentRejectionReason
                                                        );
                                                    }}
                                                    disabled={actionLoading || !documentRejectionReason.trim()}
                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-500/20"
                                                >
                                                    Confirm Rejection
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
