"use client";

import { use, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserDossierProvider, useUserDossier } from "./DossierContext";
import { motion, AnimatePresence } from "framer-motion";
import ShareWithBankModal from "@/components/staff/ShareWithBankModal";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { adminApi } from "@/lib/api";

function DossierLayoutInner({ children }: { children: React.ReactNode }) {
    const {
        userId,
        userData,
        userApplications,
        setUserApplications,
        loading,
        actionLoading,
        openCoAppModal,
        isCoAppModalOpen,
        setIsCoAppModalOpen,
        coAppName,
        setCoAppName,
        coAppRelation,
        setCoAppRelation,
        coAppPhone,
        setCoAppPhone,
        coAppEmail,
        setCoAppEmail,
        coAppIncome,
        setCoAppIncome,
        handleSaveCoApp,
        routingApp,
        setRoutingApp,
        isShareModalOpen,
        setIsShareModalOpen
    } = useUserDossier();

    const router = useRouter();
    const pathname = usePathname();

    const handleBack = () => {
        router.push("/staff/users");
    };

    // Determine current active tab based on pathname
    let activeTab = "profile";
    if (pathname.endsWith("/applications")) {
        activeTab = "applications";
    } else if (pathname.endsWith("/evv")) {
        activeTab = "evv";
    } else if (pathname.endsWith("/follow-ups")) {
        activeTab = "follow-ups";
    } else if (pathname.endsWith("/notes")) {
        activeTab = "notes";
    } else if (pathname.endsWith("/documents")) {
        activeTab = "documents";
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex items-center justify-center relative overflow-hidden">
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
            <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex items-center justify-center relative">
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

    const navigationTabs = [
        { id: "profile", label: "Profile Details", path: `/staff/users/${userId}`, icon: "badge" },
        { id: "applications", label: "Bank Applications", path: `/staff/users/${userId}/applications`, icon: "article", badge: userApplications.length > 0 ? userApplications.length : undefined },
        { id: "evv", label: "EVV Analysis", path: `/staff/users/${userId}/evv`, icon: "payments" },
        { id: "follow-ups", label: "Follow-ups", path: `/staff/users/${userId}/follow-ups`, icon: "assignment_turned_in" },
        { id: "notes", label: "Internal Notes", path: `/staff/users/${userId}/notes`, icon: "sticky_note_2" },
        { id: "documents", label: "Documents", path: `/staff/users/${userId}/documents`, icon: "folder" }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 relative overflow-hidden pb-16">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
                {/* Header Actions */}
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-xs font-black uppercase tracking-widest transition-all cursor-pointer group"
                    >
                        <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                        Back to Members
                    </button>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-md shadow-indigo-500/10">
                            {userData.avatarUrl ? (
                                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span>{(userData.firstName || "U").substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                {userData.firstName || "—"} {userData.lastName || ""}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1.5">
                                <span className="font-mono">ID: {userData.id || "VL-STU-2026-00041"}</span>
                                <span className="text-slate-300">•</span>
                                <span>Registered: {formatDate(userData.createdAt, "MMM d, yyyy")}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={openCoAppModal}
                            disabled={actionLoading}
                            className="px-4 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] rounded-xl font-semibold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                        >
                            <span className="material-symbols-outlined text-[16px] text-slate-500">edit_note</span>
                            Change Co-Applicant
                        </button>
                        <button
                            onClick={() => {
                                router.push(`/staff/chat-customer?id=${userData.id || userData._id}&email=${userData.email || ""}&firstName=${userData.firstName || ""}&lastName=${userData.lastName || ""}&phone=${userData.phoneNumber || userData.mobile || userData.phone || ""}`);
                            }}
                            className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-xl font-semibold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center shadow-sm shadow-[#7C3AED]/10"
                        >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                            Chat with Student
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="relative border-b border-slate-200 mb-8 w-full">
                    <div className="flex items-center w-full overflow-x-auto scrollbar-hide pr-12">
                        {navigationTabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <Link key={tab.id} href={tab.path} className="relative py-3 px-4 text-sm font-medium transition-colors hover:text-indigo-600 focus:outline-none select-none whitespace-nowrap shrink-0">
                                    <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
                                        {tab.label}
                                        {tab.badge && (
                                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </span>
                                    {isActive && (
                                        <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                    {/* Visual fade overlay indicating horizontal scrollability */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F8FAFC] to-transparent pointer-events-none z-10" />
                </div>

                {/* Nested Page Render */}
                {children}

                {/* Edit Co-applicant Details Modal */}
                {isCoAppModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/40"
                        >
                            <div className="bg-gradient-to-r from-indigo-500/10 to-[#6605c7]/10 border-b border-indigo-100 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                        <span className="material-symbols-outlined text-[20px]">groups</span>
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-black text-[#1a1626] uppercase tracking-wider">Modify Co-applicant Profile</h3>
                                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Edit co-applicant information for user directory & active loan files</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Co-applicant Name</label>
                                    <input
                                        type="text"
                                        value={coAppName}
                                        onChange={(e) => setCoAppName(e.target.value)}
                                        placeholder="Enter co-applicant full name"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Relationship to Student</label>
                                        <select
                                            value={coAppRelation}
                                            onChange={(e) => setCoAppRelation(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                                        >
                                            <option value="" disabled>Select relation...</option>
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Brother">Brother</option>
                                            <option value="Sister">Sister</option>
                                            <option value="Uncle">Uncle</option>
                                            <option value="Aunt">Aunt</option>
                                            <option value="Guardian">Guardian</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Annual Income (INR)</label>
                                        <input
                                            type="number"
                                            value={coAppIncome}
                                            onChange={(e) => setCoAppIncome(e.target.value)}
                                            placeholder="Example: 600000"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={coAppPhone}
                                            onChange={(e) => setCoAppPhone(e.target.value)}
                                            placeholder="Enter 10-digit mobile number"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={coAppEmail}
                                            onChange={(e) => setCoAppEmail(e.target.value)}
                                            placeholder="example@mail.com"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCoAppModalOpen(false)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCoApp}
                                    disabled={actionLoading || !coAppRelation}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-[#6605c7] hover:opacity-90 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Share/Route to Bank Modal */}
                {isShareModalOpen && routingApp && (
                    <ShareWithBankModal
                        applicationId={routingApp.id}
                        applicationNumber={routingApp.applicationNumber || ""}
                        studentName={`${userData.firstName || ""} ${userData.lastName || ""}`}
                        loanAmount={routingApp.amount || 1500000}
                        isOpen={isShareModalOpen}
                        onClose={() => {
                            setIsShareModalOpen(false);
                            setRoutingApp(null);
                        }}
                        onSuccess={async () => {
                            setIsShareModalOpen(false);
                            setRoutingApp(null);
                            // Refresh data to show routed status
                            try {
                                const appsRes = await adminApi.getApplications({}) as any;
                                const fetchedApps = appsRes.data || [];
                                const userApps = fetchedApps.filter((app: any) =>
                                    app.userId === userId || app.user_id === userId || app.applicantId === userId || app.linkedUserId === userId ||
                                    (userData && (app.userId === userData.id || app.user_id === userData.id || app.applicantId === userData.id))
                                );
                                setUserApplications(userApps);
                            } catch (e) {
                                console.error("Failed to refresh applications list:", e);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default function UserDossierLayout({
    params,
    children
}: {
    params: Promise<{ id: string }>;
    children: React.ReactNode;
}) {
    const { id } = use(params);
    return (
        <UserDossierProvider userId={id}>
            <DossierLayoutInner>{children}</DossierLayoutInner>
        </UserDossierProvider>
    );
}
