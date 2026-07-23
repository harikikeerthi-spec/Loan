"use client";

import { useState, useEffect } from "react";
import { supportApi } from "@/lib/api";

interface UserSupportTicketsViewProps {
    userRole?: string;
    userInfo?: {
        id?: string;
        name?: string;
        email?: string;
    };
}

const CATEGORIES = [
    { value: "Loan Application", label: "Loan Application Issue", icon: "assignment" },
    { value: "Document Verification", label: "Document Verification / KYC", icon: "verified" },
    { value: "Bank Statement", label: "Bank Statement / EVV Analysis", icon: "account_balance" },
    { value: "Disbursement", label: "Disbursement & Sanction Letter", icon: "payments" },
    { value: "Technical Issue", label: "Technical & System Error", icon: "bug_report" },
    { value: "Profile", label: "Profile & Account Settings", icon: "person" },
    { value: "Others", label: "General Query / Others", icon: "help_outline" },
];

const PRIORITIES = [
    { value: "low", label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: "medium", label: "Medium", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "high", label: "High", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "critical", label: "Urgent / Critical", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const parseISTDate = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    let s = String(dateVal).trim();
    if (!s.endsWith("Z") && !s.includes("+") && !s.includes("Z")) {
        s += "Z";
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
};

const formatIST = (dateVal: any): string => {
    if (!dateVal) return "—";
    const d = parseISTDate(dateVal);
    const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    };
    return new Intl.DateTimeFormat("en-IN", options).format(d);
};

export default function UserSupportTicketsView({ userRole = "student", userInfo }: UserSupportTicketsViewProps) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"my_tickets" | "create">("my_tickets");

    // Selected ticket view
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replying, setReplying] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Form state for creating ticket
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("Loan Application");
    const [priority, setPriority] = useState("medium");
    const [description, setDescription] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [createdTicketNum, setCreatedTicketNum] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, [userInfo?.id]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            // Always filter by this user's ID — each user should only see their own tickets
            const params: Record<string, any> = { limit: 100, sortBy: "createdAt", sortOrder: "desc" };
            if (userInfo?.id) {
                params.createdById = userInfo.id;
            }
            const res = await supportApi.getTickets(params) as any;
            const data = res?.data || res || {};
            const fetched = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
            setTickets(fetched);
            // Select first ticket if none selected and tickets exist
            if (fetched.length > 0 && !selectedTicket) {
                handleSelectTicket(fetched[0]);
            }
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = async (t: any) => {
        try {
            const detail = await supportApi.getTicket(t.id) as any;
            // getTicket returns the ticket object directly (or wrapped in .data)
            setSelectedTicket(detail?.data || detail);
        } catch (err) {
            setSelectedTicket(t);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;
        setReplying(true);
        setFormError("");
        try {
            await supportApi.addComment(selectedTicket.id, replyText.trim());
            setReplyText("");
            // Refresh ticket to show the new comment
            const updated = await supportApi.getTicket(selectedTicket.id) as any;
            setSelectedTicket(updated?.data || updated);
        } catch (err: any) {
            console.error("Failed to send reply:", err);
            setFormError(err?.message || "Failed to send reply. Please try again.");
        } finally {
            setReplying(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 20 * 1024 * 1024) {
                setFormError("File size exceeds 20MB limit.");
                return;
            }
            setProofFile(file);
            setFormError("");
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) {
            setFormError("Please enter both a subject and description.");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            // Send JSON payload (not FormData) — attachment is uploaded separately
            const payload = {
                subject: subject.trim(),
                category,
                priority,
                description: description.trim(),
                userRole: userRole || undefined,
                studentName: userInfo?.name || undefined,
                userEmail: userInfo?.email || undefined,
                tags: userRole ? [userRole.toUpperCase()] : [],
            };

            const res = await supportApi.createTicket(payload) as any;
            const newTicket = res?.data || res;
            const ticketId = newTicket?.id;
            const ticketNum = newTicket?.ticketNumber || ("ST-" + Math.floor(100000 + Math.random() * 900000));

            // Upload proof attachment separately if selected
            if (proofFile && ticketId) {
                try {
                    await supportApi.uploadAttachment(ticketId, proofFile);
                } catch (uploadErr: any) {
                    console.warn("Attachment upload warning:", uploadErr);
                }
            }

            setCreatedTicketNum(ticketNum);

            // Reset form
            setSubject("");
            setDescription("");
            setProofFile(null);
            loadTickets();
        } catch (err: any) {
            setFormError(err.message || "Failed to create support ticket. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTickets = filterStatus === "all"
        ? tickets
        : tickets.filter((t) => t.status === filterStatus);

    const openCount = tickets.filter((t) => t.status === "open").length;
    const inProgressCount = tickets.filter((t) => t.status === "in_progress" || t.status === "assigned").length;
    const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    return (
        <div className="space-y-6 font-sans">
            {/* Header & Main Page Navigation Banner */}
            <div className="bg-gradient-to-r from-[#6605c7] to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-wider text-purple-200 border border-white/20">
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Help & Support Center
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 text-white">
                            {userRole}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">Support Desk</h2>
                    <p className="text-xs md:text-sm text-purple-200 font-medium">Submit tickets & track resolution progress dynamically in real-time.</p>
                </div>

                {/* Page Navigation Tabs */}
                <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20 shrink-0 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => { setActiveTab("my_tickets"); setCreatedTicketNum(null); }}
                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-0 cursor-pointer ${
                            activeTab === "my_tickets"
                                ? "bg-white text-[#6605c7] shadow-lg"
                                : "text-white hover:bg-white/10"
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">confirmation_number</span>
                        My Tickets ({tickets.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab("create"); setCreatedTicketNum(null); }}
                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-0 cursor-pointer ${
                            activeTab === "create"
                                ? "bg-white text-[#6605c7] shadow-lg"
                                : "text-white hover:bg-white/10"
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        New Support Ticket
                    </button>
                </div>
            </div>

            {/* TAB 1: CREATE NEW SUPPORT TICKET (PAGE INLINE VIEW) */}
            {activeTab === "create" && (
                <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 md:p-8 space-y-6">
                    {createdTicketNum ? (
                        <div className="py-12 text-center space-y-6 max-w-md mx-auto">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                                <span className="material-symbols-outlined text-4xl">check_circle</span>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">Support Ticket Raised!</h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    Your support ticket has been registered successfully. Our resolution team will review and respond shortly.
                                </p>
                            </div>
                            <div className="inline-block bg-purple-50 border border-purple-200 px-6 py-3 rounded-2xl">
                                <span className="text-xs text-gray-400 font-bold block uppercase tracking-widest">Ticket ID</span>
                                <span className="text-xl font-black text-[#6605c7] font-mono">{createdTicketNum}</span>
                            </div>
                            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCreatedTicketNum(null)}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0"
                                >
                                    Raise Another Ticket
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab("my_tickets"); setCreatedTicketNum(null); }}
                                    className="px-6 py-3 bg-[#6605c7] hover:bg-[#5204a3] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-lg shadow-purple-600/20"
                                >
                                    View My Tickets List
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateSubmit} className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#6605c7]">edit_document</span>
                                        Raise a Support Ticket
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Submitting as: <strong className="text-gray-800">{userInfo?.name || "User"}</strong> ({userInfo?.email || "No email"})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("my_tickets")}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Cancel & Go Back
                                </button>
                            </div>

                            {formError && (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    {formError}
                                </div>
                            )}

                            {/* Category Select */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500">
                                    Issue Category <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setCategory(cat.value)}
                                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                                                category === cat.value
                                                    ? "border-[#6605c7] bg-purple-50/80 text-[#6605c7] font-bold shadow-xs ring-2 ring-[#6605c7]/20"
                                                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                category === cat.value ? "bg-[#6605c7] text-white" : "bg-purple-50 text-[#6605c7]"
                                            }`}>
                                                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                                            </div>
                                            <span className="text-xs font-bold truncate">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Selector */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500">
                                    Priority Level
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {PRIORITIES.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setPriority(p.value)}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                priority === p.value
                                                    ? `${p.color} ring-2 ring-[#6605c7]/30 font-black shadow-xs`
                                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ticket Subject */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500">
                                    Ticket Subject / Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Briefly state the issue (e.g. Document verification status stuck)"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:bg-white transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500">
                                    Detailed Description & Steps to Reproduce <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide complete details, error codes, application numbers or context so our team can resolve it quickly..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:bg-white transition-all resize-none"
                                />
                            </div>

                            {/* Proof Attachment */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500">
                                    Proof Attachment / Screenshot (Optional, Max 20MB)
                                </label>
                                <div className="border-2 border-dashed border-purple-200 hover:border-[#6605c7] rounded-2xl p-6 bg-purple-50/30 transition-all text-center relative group">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {proofFile ? (
                                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-purple-100 shadow-xs z-20 relative max-w-md mx-auto">
                                            <div className="flex items-center gap-3 text-left truncate">
                                                <span className="material-symbols-outlined text-[#6605c7] text-2xl">attach_file</span>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{proofFile.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{(proofFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setProofFile(null)}
                                                className="text-rose-500 hover:text-rose-700 p-1 border-0 bg-transparent cursor-pointer z-30"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <span className="material-symbols-outlined text-3xl text-[#6605c7]">cloud_upload</span>
                                            <p className="text-xs font-bold text-gray-700">Click or Drag & Drop file here</p>
                                            <p className="text-[10px] text-gray-400">Supports PNG, JPG, PDF, DOCX up to 20MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit & Cancel Actions */}
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("my_tickets")}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 bg-gradient-to-r from-[#6605c7] to-indigo-600 hover:from-[#5204a3] hover:to-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Submitting Ticket...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base">send</span>
                                            Submit Ticket
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* TAB 2: MY TICKETS LIST & DETAILS VIEW */}
            {activeTab === "my_tickets" && (
                <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div
                            onClick={() => setFilterStatus("all")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                filterStatus === "all" ? "bg-purple-50 border-[#6605c7] shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Total Tickets</span>
                            <span className="text-2xl font-black text-gray-900 mt-1 block">{tickets.length}</span>
                        </div>
                        <div
                            onClick={() => setFilterStatus("open")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                filterStatus === "open" ? "bg-amber-50 border-amber-400 shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Open Issues</span>
                            <span className="text-2xl font-black text-amber-700 mt-1 block">{openCount}</span>
                        </div>
                        <div
                            onClick={() => setFilterStatus("in_progress")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                filterStatus === "in_progress" ? "bg-blue-50 border-blue-400 shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">In Progress</span>
                            <span className="text-2xl font-black text-blue-700 mt-1 block">{inProgressCount}</span>
                        </div>
                        <div
                            onClick={() => setFilterStatus("resolved")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                filterStatus === "resolved" ? "bg-emerald-50 border-emerald-400 shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Resolved</span>
                            <span className="text-2xl font-black text-emerald-700 mt-1 block">{resolvedCount}</span>
                        </div>
                    </div>

                    {/* Main Content Area: Ticket List & Detail Pane */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Ticket Cards List */}
                        <div className="lg:col-span-1 space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Submitted Tickets</h3>
                                <button
                                    type="button"
                                    onClick={loadTickets}
                                    className="text-xs text-[#6605c7] hover:underline font-bold border-0 bg-transparent cursor-pointer flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="py-12 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-gray-100">
                                    <div className="w-5 h-5 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    Loading support tickets...
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="py-12 text-center bg-white rounded-3xl border border-gray-100 p-6 space-y-3">
                                    <span className="material-symbols-outlined text-4xl text-purple-200">confirmation_number</span>
                                    <p className="text-xs text-gray-500 font-bold">No support tickets found.</p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("create")}
                                        className="px-5 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-xl uppercase tracking-wider border-0 cursor-pointer shadow-md"
                                    >
                                        Raise Support Ticket
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                                    {filteredTickets.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleSelectTicket(t)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                                                selectedTicket?.id === t.id
                                                    ? "border-[#6605c7] bg-purple-50/50 shadow-md ring-2 ring-[#6605c7]/20"
                                                    : "border-gray-100 bg-white hover:border-purple-200 hover:shadow-xs"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-mono font-bold text-[#6605c7] bg-purple-100/60 px-2 py-0.5 rounded-md">
                                                    {t.ticketNumber}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                        t.status === "resolved"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : t.status === "closed"
                                                            ? "bg-gray-100 text-gray-700"
                                                            : t.status === "in_progress"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {t.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{t.subject}</h4>
                                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100/60">
                                                <span>{t.category}</span>
                                                <span>{formatIST(t.createdAt || t.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Ticket Detail & Responses */}
                        <div className="lg:col-span-2">
                            {selectedTicket ? (
                                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                                    <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-[#6605c7] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                                                    {selectedTicket.ticketNumber}
                                                </span>
                                                <span className="text-xs font-bold text-gray-400">{selectedTicket.category}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${
                                                selectedTicket.status === "resolved"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : selectedTicket.status === "closed"
                                                    ? "bg-gray-100 text-gray-700"
                                                    : selectedTicket.status === "in_progress"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}
                                        >
                                            {selectedTicket.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Ticket Description */}
                                    <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Description</span>
                                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line font-medium">{selectedTicket.description}</p>
                                    </div>

                                    {/* Proof Attachments */}
                                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Proof Attachments</span>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTicket.attachments.map((att: any) => (
                                                    <a
                                                        key={att.id}
                                                        href={`http://localhost:5000${att.filePath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold text-[#6605c7] transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">attachment</span>
                                                        {att.fileName}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Updates & Responses Thread */}
                                    <div className="space-y-4 pt-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">Official Responses & History</h4>
                                        {!selectedTicket.comments || selectedTicket.comments.length === 0 ? (
                                            <div className="p-6 rounded-2xl bg-purple-50/40 text-center space-y-1 border border-purple-100">
                                                <p className="text-xs font-bold text-[#6605c7]">Ticket Under Review</p>
                                                <p className="text-[11px] text-gray-400">Our resolution team has received your ticket and will update you shortly.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedTicket.comments.map((c: any) => (
                                                    <div key={c.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                                            <span className="text-[#6605c7] font-black">
                                                                {c.authorName} ({c.authorRole})
                                                            </span>
                                                            <span className="text-gray-400">{formatIST(c.createdAt || c.created_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-700 font-medium leading-relaxed">{c.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Reply Input Box */}
                                    <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-gray-100">
                                        {/* Error message from sending reply */}
                                        {formError && (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600">
                                                <span className="material-symbols-outlined text-sm">error</span>
                                                {formError}
                                            </div>
                                        )}
                                        <textarea
                                            rows={3}
                                            value={replyText}
                                            onChange={(e) => { setReplyText(e.target.value); if (formError) setFormError(""); }}
                                            placeholder="Write a message or reply to support team..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#6605c7] focus:bg-white transition-all resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={replying || !replyText.trim()}
                                                className="px-6 py-2.5 bg-[#6605c7] hover:bg-[#5204a3] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border-0 disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2"
                                            >
                                                {replying ? (
                                                    <>
                                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-sm">send</span>
                                                        Send Reply
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
                                    <span className="material-symbols-outlined text-4xl text-purple-200">touch_app</span>
                                    <h4 className="text-sm font-bold text-gray-700">Select a support ticket from the list</h4>
                                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                        Click any ticket on the left pane to review its status, view uploaded proof attachments, or reply to our support team.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
