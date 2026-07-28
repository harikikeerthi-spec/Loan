"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, supportApi, blogApi } from "@/lib/api";
import Link from "next/link";
import UserSupportTicketsView from "@/components/UserSupportTicketsView";

// Block builder types for Blog CMS
type BlockType = "heading" | "container" | "text" | "image" | "video" | "button" | "list" | "quote" | "code" | "divider" | "spacer";

interface Block {
    id: string;
    type: BlockType;
    content: string;
    style?: {
        fontSize?: string;
        fontFamily?: string;
        color?: string;
        backgroundColor?: string;
        textAlign?: "left" | "center" | "right";
        padding?: string;
    };
}

const ELEMENT_TYPES: { type: BlockType; label: string; icon: string; color: string; desc: string }[] = [
    { type: "heading", label: "Heading", icon: "title", color: "blue", desc: "Drag or click to add" },
    { type: "container", label: "Container", icon: "view_agenda", color: "purple", desc: "Drag or click to add" },
    { type: "text", label: "Text Box", icon: "text_fields", color: "green", desc: "Drag or click to add" },
    { type: "image", label: "Image", icon: "image", color: "orange", desc: "Drag or click to add" },
    { type: "video", label: "Video", icon: "videocam", color: "red", desc: "Drag or click to add" },
    { type: "button", label: "Button", icon: "smart_button", color: "indigo", desc: "Drag or click to add" },
    { type: "list", label: "List", icon: "format_list_bulleted", color: "teal", desc: "Drag or click to add" },
    { type: "quote", label: "Quote", icon: "format_quote", color: "yellow", desc: "Drag or click to add" },
    { type: "code", label: "Code Block", icon: "code", color: "gray", desc: "Drag or click to add" },
    { type: "divider", label: "Divider", icon: "horizontal_rule", color: "pink", desc: "Drag or click to add" },
    { type: "spacer", label: "Spacer", icon: "unfold_more", color: "cyan", desc: "Drag or click to add" },
];

export default function ITDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"tickets" | "blogs" | "create_blog">("tickets");

    // Blog CMS States
    const [blogs, setBlogs] = useState<any[]>([]);
    const [blogsLoading, setBlogsLoading] = useState(true);
    const [blogSearch, setBlogSearch] = useState("");
    const [blogCategoryFilter, setBlogCategoryFilter] = useState("all");

    // Blog Editor States
    const [blogTitle, setBlogTitle] = useState("");
    const [blogSubtitle, setBlogSubtitle] = useState("");
    const [blogCategory, setBlogCategory] = useState("Loan Guidance");
    const [coverImage, setCoverImage] = useState("");
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [savingBlog, setSavingBlog] = useState(false);
    const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

    // Drag and Drop & Canva Visual Editor States
    const [draggedType, setDraggedType] = useState<BlockType | null>(null);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    // Canva Visual Builder States
    const [viewMode, setViewMode] = useState<"edit" | "preview" | "mobile">("edit");
    const [leftDockTab, setLeftDockTab] = useState<"elements" | "templates" | "uploads">("elements");
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [dockSearch, setDockSearch] = useState("");

    // Support Ticket Metrics
    const [ticketStats, setTicketStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        critical: 0
    });

    const loadBlogs = useCallback(async () => {
        setBlogsLoading(true);
        try {
            const res: any = await blogApi.getAll(1, 100).catch(() => ({ data: [] }));
            setBlogs(res.data || []);
        } catch (e) {
            console.error("Failed to load blogs:", e);
        } finally {
            setBlogsLoading(false);
        }
    }, []);

    const loadTicketStats = useCallback(async () => {
        try {
            const res: any = await supportApi.getTickets().catch(() => ({ data: [] }));
            const list = res.data || [];
            const open = list.filter((t: any) => t.status === "open").length;
            const inProgress = list.filter((t: any) => t.status === "in_progress").length;
            const resolved = list.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
            const critical = list.filter((t: any) => t.priority === "critical" || t.priority === "high").length;
            setTicketStats({
                total: list.length,
                open,
                inProgress,
                resolved,
                critical
            });
        } catch (e) {
            console.error("Failed to load ticket stats:", e);
        }
    }, []);

    useEffect(() => {
        loadBlogs();
        loadTicketStats();
    }, [loadBlogs, loadTicketStats]);

    // Create block helper with smart defaults
    const createBlock = (type: BlockType, customContent?: string): Block => {
        const defaults: Record<BlockType, string> = {
            heading: "Article Section Heading",
            container: "",
            text: "Enter your detailed article text here...",
            image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800",
            video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            button: "Learn More & Apply",
            list: "• First Key Point\n• Second Key Point\n• Third Key Point",
            quote: "Enter an inspiring or informative quote here...",
            code: "// Sample Code snippet or JSON\n{\n  \"status\": \"approved\"\n}",
            divider: "",
            spacer: "",
        };
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            type,
            content: customContent !== undefined ? customContent : defaults[type],
            style: {
                textAlign: "left",
                color: "#1e293b",
                backgroundColor: "transparent",
                fontSize: type === "heading" ? "24px" : "14px",
                padding: "8px"
            }
        };
    };

    const updateBlockStyle = (id: string, styleUpdates: Partial<NonNullable<Block['style']>>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, style: { ...(b.style || {}), ...styleUpdates } } : b));
    };

    const applyTemplate = (templateKey: string) => {
        let tBlocks: Block[] = [];
        if (templateKey === "education_guide") {
            tBlocks = [
                createBlock("heading", "Complete Guide to Education Loans for Abroad Studies (2026)"),
                createBlock("text", "Securing an education loan is one of the most critical steps when planning to study abroad. This comprehensive guide breaks down interest rates, top bank offerings, collateral requirements, and step-by-step application tips to get approved fast."),
                createBlock("image", "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200"),
                createBlock("heading", "Key Highlights & Eligibility Checklist"),
                createBlock("list", "• Unsecured Loans: Available up to ₹75 Lakhs without collateral\n• Interest Rates: Competitive rates starting from 9.5% p.a.\n• Moratorium Grace: Course duration + 6 to 12 months moratorium\n• Flexible Repayment: Tenure options extending up to 15 years"),
                createBlock("quote", "Pro Tip: Applying with a financial co-applicant (father/mother) with a stable income significantly boosts your loan approval speed and gets you lower interest rates."),
                createBlock("divider", ""),
                createBlock("button", "Check Your Loan Eligibility Now")
            ];
        } else if (templateKey === "bank_review") {
            tBlocks = [
                createBlock("heading", "HDFC Credila vs. IDFC FIRST Bank: Detailed Comparison"),
                createBlock("text", "Choosing between a dedicated NBFC like HDFC Credila and a premier private bank like IDFC FIRST Bank depends on your university tier, loan amount, and collateral status."),
                createBlock("image", "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200"),
                createBlock("heading", "Feature Breakdown"),
                createBlock("code", "// HDFC Credila vs IDFC First Comparison Matrix\nFeature             HDFC Credila       IDFC First\nMax Unsecured Loan  ₹75 Lakhs          ₹50 Lakhs\nProcessing Fee      1.0% - 1.5%        1.0%\nApproval Speed      3-5 Days           4-7 Days\nMoratorium Grace    Yes                Yes"),
                createBlock("quote", "Verdict: If you need high non-collateral amounts exceeding ₹50L, HDFC Credila offers higher flex limits for top US universities."),
                createBlock("button", "Apply With Partner Rate Discount")
            ];
        } else if (templateKey === "visa_checklist") {
            tBlocks = [
                createBlock("heading", "F-1 Student Visa Interview Preparation & Mandatory Checklist"),
                createBlock("text", "Passing your US F-1 student visa interview requires clean documentation and confidence. Ensure you carry original physical copies of every document below."),
                createBlock("list", "1. Valid Passport (Minimum 6 months validity)\n2. Form I-20 and SEVIS Fee (I-901) Payment Receipt\n3. Official Bank Loan Sanction Letter\n4. DS-160 Confirmation Page & Interview Appointment Confirmation\n5. Academic Transcripts & Standardized Test Scores (GRE/TOEFL)"),
                createBlock("quote", "Consular Officers prioritize clear evidence of financial capability to cover Year 1 tuition & living expenses."),
                createBlock("button", "Download Printable Checklist PDF")
            ];
        }
        setBlocks(tBlocks);
        if (tBlocks.length > 0) setSelectedBlockId(tBlocks[0].id);
    };

    // Blog builder palette drag-and-drop handlers
    const handlePaletteDragStart = (e: React.DragEvent, type: BlockType) => {
        setDraggedType(type);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handlePaletteDragEnd = () => {
        setDraggedType(null);
        setDragOverIndex(null);
    };

    // Reorder existing blocks handlers
    const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
        setDraggingBlockId(blockId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleBlockDragEnd = () => {
        setDraggingBlockId(null);
        setDragOverIndex(null);
    };

    // Canvas drop zone handlers
    const handleCanvasDragOver = (e: React.DragEvent, index?: number) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) {
            setIsDraggingFile(true);
        }
        e.dataTransfer.dropEffect = draggedType ? "copy" : "move";
        setDragOverIndex(index !== undefined ? index : blocks.length);
    };

    const handleCanvasDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(false);
    };

    const handleCanvasDrop = (e: React.DragEvent, index?: number) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const dropIndex = index !== undefined ? index : blocks.length;

        // Check if user dropped image files from desktop
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(f => f.type.startsWith("image/"));
            if (imageFiles.length > 0) {
                imageFiles.forEach((file, i) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imgUrl = event.target?.result as string;
                        if (imgUrl) {
                            const newBlock = createBlock("image", imgUrl);
                            setBlocks(prev => {
                                const next = [...prev];
                                next.splice(dropIndex + i, 0, newBlock);
                                return next;
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                });
                setDraggedType(null);
                setDraggingBlockId(null);
                setDragOverIndex(null);
                return;
            }
        }

        if (draggedType) {
            // Drop element from palette
            const newBlock = createBlock(draggedType);
            const newBlocks = [...blocks];
            newBlocks.splice(dropIndex, 0, newBlock);
            setBlocks(newBlocks);
        } else if (draggingBlockId) {
            // Reorder block on canvas
            const fromIndex = blocks.findIndex(b => b.id === draggingBlockId);
            if (fromIndex !== -1 && fromIndex !== dropIndex) {
                const newBlocks = [...blocks];
                const [removed] = newBlocks.splice(fromIndex, 1);
                const adjustedIndex = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
                newBlocks.splice(adjustedIndex, 0, removed);
                setBlocks(newBlocks);
            }
        }

        setDraggedType(null);
        setDraggingBlockId(null);
        setDragOverIndex(null);
    };

    const addBlock = (type: BlockType) => {
        const newBlock = createBlock(type);
        setBlocks(prev => [...prev, newBlock]);
    };

    const removeBlock = (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
    };

    const duplicateBlock = (id: string) => {
        const index = blocks.findIndex(b => b.id === id);
        if (index !== -1) {
            const blockToDup = blocks[index];
            const duplicated: Block = {
                ...blockToDup,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 6)
            };
            const newBlocks = [...blocks];
            newBlocks.splice(index + 1, 0, duplicated);
            setBlocks(newBlocks);
        }
    };

    const moveBlock = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= blocks.length) return;
        const newBlocks = [...blocks];
        const [moved] = newBlocks.splice(index, 1);
        newBlocks.splice(targetIndex, 0, moved);
        setBlocks(newBlocks);
    };

    const updateBlockContent = (id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    };

    const handleImageFileUpload = (blockId: string, file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                updateBlockContent(blockId, dataUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveBlog = async (publishStatus: boolean = false) => {
        if (!blogTitle.trim()) {
            alert("Please enter a blog title.");
            return;
        }

        setSavingBlog(true);
        try {
            const payload = {
                title: blogTitle,
                subtitle: blogSubtitle,
                category: blogCategory,
                coverImage,
                blocks,
                published: publishStatus,
                authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "IT Admin"
            };

            if (editingBlogId) {
                await blogApi.update(editingBlogId, payload);
                alert("Blog post updated successfully!");
            } else {
                await blogApi.create(payload);
                alert("Blog post created successfully!");
            }

            // Reset form and switch tab
            setBlogTitle("");
            setBlogSubtitle("");
            setCoverImage("");
            setBlocks([]);
            setEditingBlogId(null);
            setActiveTab("blogs");
            loadBlogs();
        } catch (e: any) {
            alert(e?.message || "Failed to save blog post");
        } finally {
            setSavingBlog(false);
        }
    };

    const handleDeleteBlog = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            await blogApi.delete(id);
            alert("Blog deleted successfully.");
            loadBlogs();
        } catch (e: any) {
            alert("Failed to delete blog: " + e.message);
        }
    };

    const handleEditBlog = (blog: any) => {
        setEditingBlogId(blog.id || blog._id);
        setBlogTitle(blog.title || "");
        setBlogSubtitle(blog.subtitle || "");
        setBlogCategory(blog.category || "Loan Guidance");
        setCoverImage(blog.coverImage || "");
        setBlocks(blog.blocks || []);
        setActiveTab("create_blog");
    };

    const filteredBlogs = blogs.filter(b => {
        const matchesSearch = !blogSearch || b.title?.toLowerCase().includes(blogSearch.toLowerCase()) || b.authorName?.toLowerCase().includes(blogSearch.toLowerCase());
        const matchesCat = blogCategoryFilter === "all" || b.category === blogCategoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="max-w-[1400px] mx-auto animate-fade-in pb-16 space-y-6">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0A2540] flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-2xl text-indigo-600">developer_board</span>
                        IT & Operations Dashboard
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Central management node for platform Support Tickets & Blog CMS publishing
                    </p>
                </div>

                {/* Tabs switcher */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                        onClick={() => setActiveTab("tickets")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === "tickets"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                        Support Tickets
                        {ticketStats.open > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white">
                                {ticketStats.open}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("blogs")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === "blogs"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">newspaper</span>
                        Blog CMS
                        <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-200 text-slate-700">
                            {blogs.length}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setEditingBlogId(null);
                            setBlogTitle("");
                            setBlogSubtitle("");
                            setCoverImage("");
                            setBlocks([]);
                            setActiveTab("create_blog");
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === "create_blog"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        New Blog Post
                    </button>
                </div>
            </div>

            {/* TAB 1: Support Tickets Hub */}
            {activeTab === "tickets" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
                            <p className="text-2xl font-extrabold text-slate-900 mt-1">{ticketStats.total}</p>
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open / Pending</p>
                            <p className="text-2xl font-extrabold text-blue-600 mt-1">{ticketStats.open}</p>
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{ticketStats.inProgress}</p>
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved</p>
                            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{ticketStats.resolved}</p>
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Urgent / High</p>
                            <p className="text-2xl font-extrabold text-rose-600 mt-1">{ticketStats.critical}</p>
                        </div>
                    </div>

                    {/* Support Tickets Main View */}
                    <UserSupportTicketsView
                        userRole="staff"
                        userInfo={{
                            id: user?.id,
                            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'IT Staff',
                            email: user?.email
                        }}
                    />
                </div>
            )}

            {/* TAB 2: Blog CMS Management */}
            {activeTab === "blogs" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Controls bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 flex-1 max-w-md">
                            <div className="relative w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                <input
                                    type="text"
                                    value={blogSearch}
                                    onChange={e => setBlogSearch(e.target.value)}
                                    placeholder="Search blog posts by title or author..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={blogCategoryFilter}
                                onChange={e => setBlogCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="Loan Guidance">Loan Guidance</option>
                                <option value="Bank Reviews">Bank Reviews</option>
                                <option value="Student Life">Student Life</option>
                                <option value="Visa & Admissions">Visa & Admissions</option>
                            </select>

                            <button
                                onClick={loadBlogs}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shadow-2xs"
                            >
                                <span className="material-symbols-outlined text-[16px]">refresh</span>
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Blog list grid */}
                    <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs uppercase tracking-wider font-sans font-extrabold text-left">
                                    <tr>
                                        <th className="px-6 py-4">Article</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Author</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {blogsLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                                <p className="text-xs font-bold text-slate-400">Loading blog articles...</p>
                                            </td>
                                        </tr>
                                    ) : filteredBlogs.length > 0 ? (
                                        filteredBlogs.map((blog: any) => (
                                            <tr key={blog.id || blog._id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {blog.coverImage ? (
                                                            <img src={blog.coverImage} alt={blog.title} className="w-12 h-10 object-cover rounded-lg shrink-0 border border-slate-200" />
                                                        ) : (
                                                            <div className="w-12 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                                                                <span className="material-symbols-outlined text-[18px]">article</span>
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <Link href={`/blog/${blog.slug || blog.id || blog._id}`} target="_blank" className="text-[15px] font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate max-w-[320px]">
                                                                {blog.title || "Untitled Blog"}
                                                            </Link>
                                                            <p className="text-xs text-slate-400 truncate max-w-[300px] mt-0.5">{blog.subtitle || blog.excerpt || "No description"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                                                        {blog.category || "General"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-semibold text-slate-700">{blog.authorName || "IT Admin"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                                        blog.published ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                                    }`}>
                                                        {blog.published ? "Published" : "Draft"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditBlog(blog)}
                                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all border border-indigo-200 cursor-pointer flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">edit</span>
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBlog(blog.id || blog._id, blog.title)}
                                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all border border-rose-200 cursor-pointer flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                                                <span className="material-symbols-outlined text-4xl mb-2">newspaper</span>
                                                <p className="text-xs font-bold uppercase tracking-wider">No Blog Articles Found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: Canva-Style Visual Page Builder */}
            {activeTab === "create_blog" && (
                <div className="bg-slate-900/5 rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden animate-in fade-in duration-200 space-y-0">
                    
                    {/* 1. CANVA TOP HEADER BAR */}
                    <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
                        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                <span className="material-symbols-outlined text-xl">palette</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <input
                                    type="text"
                                    value={blogTitle}
                                    onChange={e => setBlogTitle(e.target.value)}
                                    placeholder="Enter Article Title Here..."
                                    className="w-full bg-transparent text-sm md:text-base font-bold text-white placeholder-slate-400 focus:outline-none focus:border-b focus:border-indigo-400 pb-0.5"
                                />
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                                    <span>Category:</span>
                                    <select
                                        value={blogCategory}
                                        onChange={e => setBlogCategory(e.target.value)}
                                        className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 text-[11px] font-semibold focus:outline-none cursor-pointer"
                                    >
                                        <option value="Loan Guidance">Loan Guidance</option>
                                        <option value="Bank Reviews">Bank Reviews</option>
                                        <option value="Student Life">Student Life</option>
                                        <option value="Visa & Admissions">Visa & Admissions</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Center Device / View Mode Switcher */}
                        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 select-none">
                            <button
                                type="button"
                                onClick={() => setViewMode("edit")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === "edit" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                                Edit Canvas
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("preview")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === "preview" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                Preview
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("mobile")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === "mobile" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                                Mobile View
                            </button>
                        </div>

                        {/* Right Header Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("blogs")}
                                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                                Back to List
                            </button>
                            <button
                                type="button"
                                disabled={savingBlog}
                                onClick={() => handleSaveBlog(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
                            >
                                Save Draft
                            </button>
                            <button
                                type="button"
                                disabled={savingBlog}
                                onClick={() => handleSaveBlog(true)}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[16px]">publish</span>
                                Publish Post
                            </button>
                        </div>
                    </div>

                    {/* 2. CONTEXTUAL FORMATTING BAR (CANVA TOP TOOLBAR) */}
                    <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-4 overflow-x-auto shadow-xs">
                        {selectedBlockId ? (
                            (() => {
                                const selectedBlock = blocks.find(b => b.id === selectedBlockId);
                                if (!selectedBlock) return null;
                                return (
                                    <div className="flex items-center gap-3 w-full justify-between select-none">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                                                {selectedBlock.type}
                                            </span>
                                            
                                            {/* Font Size Selector */}
                                            <select
                                                value={selectedBlock.style?.fontSize || "14px"}
                                                onChange={(e) => updateBlockStyle(selectedBlock.id, { fontSize: e.target.value })}
                                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                                            >
                                                <option value="12px">12px Small</option>
                                                <option value="14px">14px Body</option>
                                                <option value="16px">16px Medium</option>
                                                <option value="20px">20px Subtitle</option>
                                                <option value="24px">24px Heading</option>
                                                <option value="32px">32px Title</option>
                                            </select>

                                            {/* Text Alignment */}
                                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                {(["left", "center", "right"] as const).map(align => (
                                                    <button
                                                        key={align}
                                                        type="button"
                                                        onClick={() => updateBlockStyle(selectedBlock.id, { textAlign: align })}
                                                        className={`p-1 rounded-md text-slate-600 transition-all ${
                                                            (selectedBlock.style?.textAlign || "left") === align ? "bg-white text-indigo-600 shadow-2xs font-bold" : "hover:bg-slate-200/50"
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">format_align_{align}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Text Colors */}
                                            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                                <span className="text-[10px] font-bold text-slate-400">Color:</span>
                                                {[
                                                    { name: "Slate", color: "#1e293b" },
                                                    { name: "Indigo", color: "#4f46e5" },
                                                    { name: "Emerald", color: "#059669" },
                                                    { name: "Rose", color: "#e11d48" },
                                                    { name: "Amber", color: "#d97706" }
                                                ].map(c => (
                                                    <button
                                                        key={c.name}
                                                        type="button"
                                                        onClick={() => updateBlockStyle(selectedBlock.id, { color: c.color })}
                                                        className="w-5 h-5 rounded-full border border-slate-200 transition-transform hover:scale-110 cursor-pointer"
                                                        style={{ backgroundColor: c.color }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>

                                            {/* Background Tint */}
                                            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                                <span className="text-[10px] font-bold text-slate-400">Fill:</span>
                                                {[
                                                    { name: "None", color: "transparent" },
                                                    { name: "Indigo Soft", color: "#eef2ff" },
                                                    { name: "Slate Soft", color: "#f8fafc" },
                                                    { name: "Amber Soft", color: "#fffbeb" },
                                                    { name: "Emerald Soft", color: "#ecfdf5" }
                                                ].map(c => (
                                                    <button
                                                        key={c.name}
                                                        type="button"
                                                        onClick={() => updateBlockStyle(selectedBlock.id, { backgroundColor: c.color })}
                                                        className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 cursor-pointer"
                                                        style={{ backgroundColor: c.color === "transparent" ? "#ffffff" : c.color }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => duplicateBlock(selectedBlock.id)}
                                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                Duplicate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { removeBlock(selectedBlock.id); setSelectedBlockId(null); }}
                                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 py-0.5">
                                <span className="material-symbols-outlined text-indigo-600 text-[18px]">info</span>
                                Select any element on the paper stage to format typography, colors, and layout background.
                            </div>
                        )}
                    </div>

                    {/* 3. CANVA EDITOR BODY (SIDE DOCK + STAGE) */}
                    <div className="flex flex-col md:flex-row items-stretch min-h-[750px] bg-slate-200/50">
                        
                        {/* LEFT TOOL DOCK (280px Wide Side Panel) */}
                        <div className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                            
                            {/* Dock Tab Selector */}
                            <div className="flex border-b border-slate-200 bg-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setLeftDockTab("elements")}
                                    className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                        leftDockTab === "elements" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">widgets</span>
                                    Elements
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeftDockTab("templates")}
                                    className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                        leftDockTab === "templates" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    Templates
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeftDockTab("uploads")}
                                    className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                        leftDockTab === "uploads" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                                    Uploads
                                </button>
                            </div>

                            {/* Dock Search */}
                            <div className="p-3 border-b border-slate-100">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                                    <input
                                        type="text"
                                        value={dockSearch}
                                        onChange={e => setDockSearch(e.target.value)}
                                        placeholder={`Search ${leftDockTab}...`}
                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            {/* Dock Content Body */}
                            <div className="flex-1 p-3 overflow-y-auto max-h-[620px] space-y-3">
                                
                                {/* TAB A: ELEMENTS PALETTE */}
                                {leftDockTab === "elements" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {ELEMENT_TYPES.filter(e => !dockSearch || e.label.toLowerCase().includes(dockSearch.toLowerCase())).map(elem => (
                                            <div
                                                key={elem.type}
                                                draggable
                                                onDragStart={(e) => handlePaletteDragStart(e, elem.type)}
                                                onDragEnd={handlePaletteDragEnd}
                                                onClick={() => addBlock(elem.type)}
                                                className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-400 rounded-xl transition-all cursor-grab active:cursor-grabbing select-none group text-left flex flex-col justify-between min-h-[85px] shadow-2xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="material-symbols-outlined text-xl text-indigo-600 group-hover:scale-110 transition-transform">{elem.icon}</span>
                                                    <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-indigo-400">add_circle</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">{elem.label}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{elem.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* TAB B: PRE-DESIGNED TEMPLATES */}
                                {leftDockTab === "templates" && (
                                    <div className="space-y-3">
                                        <div
                                            onClick={() => applyTemplate("education_guide")}
                                            className="p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:border-indigo-500 rounded-2xl cursor-pointer transition-all hover:shadow-md group"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-600 text-white rounded">Template</span>
                                            <h5 className="text-xs font-bold text-indigo-950 mt-1.5 group-hover:text-indigo-600">Education Loan Guide</h5>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Title + Intro + Image + Highlights + Pro Tip Quote + CTA</p>
                                        </div>

                                        <div
                                            onClick={() => applyTemplate("bank_review")}
                                            className="p-3.5 bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200 hover:border-purple-500 rounded-2xl cursor-pointer transition-all hover:shadow-md group"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-600 text-white rounded">Template</span>
                                            <h5 className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-purple-600">Bank Comparison Review</h5>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Head-to-head analysis + Comparison Table Code + Apply Button</p>
                                        </div>

                                        <div
                                            onClick={() => applyTemplate("visa_checklist")}
                                            className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all hover:shadow-md group"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded">Template</span>
                                            <h5 className="text-xs font-bold text-emerald-950 mt-1.5 group-hover:text-emerald-700">F-1 Visa Checklist</h5>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Title + Step-by-Step Document List + Quote + Download CTA</p>
                                        </div>
                                    </div>
                                )}

                                {/* TAB C: UPLOADS */}
                                {leftDockTab === "uploads" && (
                                    <div className="space-y-4 text-center">
                                        <label className="p-6 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 rounded-2xl block cursor-pointer transition-all">
                                            <span className="material-symbols-outlined text-4xl text-indigo-600 mb-1">cloud_upload</span>
                                            <p className="text-xs font-bold text-indigo-900">Upload Asset Files</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP or SVG up to 10MB</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const reader = new FileReader();
                                                        reader.onload = (evt) => {
                                                            const dataUrl = evt.target?.result as string;
                                                            if (dataUrl) {
                                                                const newImgBlock = createBlock("image", dataUrl);
                                                                setBlocks(prev => [...prev, newImgBlock]);
                                                                setSelectedBlockId(newImgBlock.id);
                                                            }
                                                        };
                                                        reader.readAsDataURL(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                        <p className="text-[11px] text-slate-400 font-medium">Uploaded images auto-create an image block on the canvas.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CENTER CANVAS STAGE (DIGITAL PAPER PAGE) */}
                        <div className="flex-1 bg-slate-200/60 p-6 md:p-10 flex justify-center min-h-[750px] overflow-auto select-none">
                            <div
                                onDragOver={(e) => handleCanvasDragOver(e)}
                                onDragLeave={handleCanvasDragLeave}
                                onDrop={(e) => handleCanvasDrop(e)}
                                className={`w-full transition-all duration-300 bg-white shadow-2xl rounded-2xl p-6 md:p-12 border border-slate-200 min-h-[720px] flex flex-col relative ${
                                    viewMode === "mobile" ? "max-w-[380px]" : "max-w-[800px]"
                                } ${isDraggingFile || draggedType ? "ring-4 ring-indigo-500/50 bg-indigo-50/10" : ""}`}
                            >
                                {/* Digital Paper Header Watermark */}
                                <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                                        <span className="material-symbols-outlined text-[16px] text-indigo-600">description</span>
                                        <span>{blogCategory || "Loan Guidance"}</span>
                                        <span>•</span>
                                        <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-100 rounded">
                                        {viewMode === "mobile" ? "Mobile View" : "Paper Stage"}
                                    </span>
                                </div>

                                {/* Cover Image preview if present */}
                                {coverImage && (
                                    <div className="mb-6 rounded-xl overflow-hidden max-h-64 border border-slate-200 shadow-sm">
                                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Main Title Header preview */}
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
                                    {blogTitle || "Untitled Article Header"}
                                </h1>

                                {/* Blocks List Container */}
                                <div className="space-y-4 flex-1">
                                    {blocks.length === 0 ? (
                                        <div className="py-20 text-center text-slate-400 my-auto">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                                                <span className="material-symbols-outlined text-3xl">post_add</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-700 mb-1">Canvas Page is Empty</h4>
                                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                                Drag elements from the left panel, load a template, or drop an image file to start composing.
                                            </p>
                                        </div>
                                    ) : (
                                        blocks.map((block, index) => {
                                            const isSelected = selectedBlockId === block.id;
                                            return (
                                                <React.Fragment key={block.id}>
                                                    {dragOverIndex === index && (
                                                        <div className="h-2 bg-indigo-500 rounded-full animate-pulse my-1" />
                                                    )}

                                                    <div
                                                        draggable={viewMode === "edit"}
                                                        onClick={() => setSelectedBlockId(block.id)}
                                                        onDragStart={(e) => handleBlockDragStart(e, block.id)}
                                                        onDragEnd={handleBlockDragEnd}
                                                        onDragOver={(e) => handleCanvasDragOver(e, index)}
                                                        onDrop={(e) => handleCanvasDrop(e, index)}
                                                        className={`group relative rounded-xl p-3 transition-all cursor-pointer ${
                                                            isSelected
                                                                ? "ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50/20 shadow-sm"
                                                                : "hover:ring-1 hover:ring-slate-300"
                                                        }`}
                                                        style={{
                                                            color: block.style?.color || "#1e293b",
                                                            backgroundColor: block.style?.backgroundColor || "transparent",
                                                            textAlign: block.style?.textAlign || "left",
                                                        }}
                                                    >
                                                        {/* Hover / Active Drag Handle Badge */}
                                                        {viewMode === "edit" && (
                                                            <div className="absolute -top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 z-10 cursor-grab">
                                                                <span className="material-symbols-outlined text-[12px]">drag_indicator</span>
                                                                #{index + 1} {block.type}
                                                            </div>
                                                        )}

                                                        {/* Block Content Renderers */}
                                                        {block.type === "heading" ? (
                                                            <input
                                                                type="text"
                                                                value={block.content}
                                                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                                className="w-full font-bold text-slate-900 bg-transparent border-none focus:outline-none"
                                                                style={{ fontSize: block.style?.fontSize || "22px" }}
                                                                placeholder="Heading..."
                                                            />
                                                        ) : block.type === "image" ? (
                                                            <div className="space-y-2">
                                                                {block.content ? (
                                                                    <img src={block.content} alt="Asset" className="max-h-72 w-full object-cover rounded-xl border border-slate-200" />
                                                                ) : (
                                                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
                                                                        <span className="material-symbols-outlined text-3xl text-slate-400">image</span>
                                                                        <p className="text-xs text-slate-400">Click or drag image file here</p>
                                                                    </div>
                                                                )}
                                                                {isSelected && (
                                                                    <input
                                                                        type="text"
                                                                        value={block.content}
                                                                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                                        placeholder="Image URL..."
                                                                        className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                                                    />
                                                                )}
                                                            </div>
                                                        ) : block.type === "divider" ? (
                                                            <hr className="border-t-2 border-slate-300 my-2" />
                                                        ) : block.type === "quote" ? (
                                                            <div className="border-l-4 border-indigo-600 pl-4 py-2 bg-indigo-50/50 rounded-r-xl my-2">
                                                                <textarea
                                                                    value={block.content}
                                                                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                                    rows={2}
                                                                    className="w-full font-semibold italic text-indigo-950 bg-transparent border-none focus:outline-none resize-y text-sm"
                                                                />
                                                            </div>
                                                        ) : block.type === "code" ? (
                                                            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs my-2">
                                                                <textarea
                                                                    value={block.content}
                                                                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                                    rows={3}
                                                                    className="w-full bg-transparent text-emerald-400 border-none focus:outline-none font-mono text-xs resize-y"
                                                                />
                                                            </div>
                                                        ) : block.type === "button" ? (
                                                            <div className="my-2">
                                                                <button
                                                                    type="button"
                                                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                                                                >
                                                                    {block.content || "Click Here"}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                value={block.content}
                                                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                                rows={3}
                                                                className="w-full bg-transparent border-none focus:outline-none resize-y text-slate-800 text-sm leading-relaxed"
                                                                style={{ fontSize: block.style?.fontSize || "14px" }}
                                                                placeholder="Enter paragraph text..."
                                                            />
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Edit Modal */}
            {showEditModal && editingBlock && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Edit {editingBlock.type} Block
                            </h4>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Block Content</label>
                                <textarea
                                    value={editingBlock.content}
                                    onChange={e => setEditingBlock({ ...editingBlock, content: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700">Cancel</button>
                            <button
                                onClick={() => {
                                    setBlocks(prev => prev.map(b => b.id === editingBlock.id ? editingBlock : b));
                                    setShowEditModal(false);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
