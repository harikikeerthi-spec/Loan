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

    // Blog builder handlers
    const addBlock = (type: BlockType) => {
        const newBlock: Block = {
            id: Date.now().toString(),
            type,
            content: type === "heading" ? "Heading Title" : type === "text" ? "Enter your content here..." : type === "button" ? "Click Here" : "",
            style: { textAlign: "left" }
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    const removeBlock = (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
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

            {/* TAB 3: Create & Edit Blog Builder */}
            {activeTab === "create_blog" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingBlogId ? "Edit Blog Article" : "Create New Blog Post"}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Use the drag-and-drop block builder to compose content</p>
                        </div>
                        <button
                            onClick={() => setActiveTab("blogs")}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                            Cancel & Back
                        </button>
                    </div>

                    {/* Metadata fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Article Title</label>
                            <input
                                type="text"
                                value={blogTitle}
                                onChange={e => setBlogTitle(e.target.value)}
                                placeholder="e.g., Complete Guide to Education Loans for Abroad Studies 2026"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Category</label>
                            <select
                                value={blogCategory}
                                onChange={e => setBlogCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            >
                                <option value="Loan Guidance">Loan Guidance</option>
                                <option value="Bank Reviews">Bank Reviews</option>
                                <option value="Student Life">Student Life</option>
                                <option value="Visa & Admissions">Visa & Admissions</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Cover Image URL</label>
                            <input
                                type="text"
                                value={coverImage}
                                onChange={e => setCoverImage(e.target.value)}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Block Palette */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Add Content Elements</p>
                        <div className="flex flex-wrap gap-2">
                            {ELEMENT_TYPES.map(elem => (
                                <button
                                    key={elem.type}
                                    type="button"
                                    onClick={() => addBlock(elem.type)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-lg text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">{elem.icon}</span>
                                    {elem.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Canvas / Blocks List */}
                    <div className="min-h-[300px] border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-4">
                        {blocks.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2">view_compact</span>
                                <p className="text-xs font-bold uppercase tracking-wider">No elements added yet</p>
                                <p className="text-xs text-slate-400 mt-1">Click any element above to add it to your article</p>
                            </div>
                        ) : (
                            blocks.map((block, index) => (
                                <div key={block.id} className="group relative border border-slate-200 hover:border-indigo-400 rounded-xl p-4 bg-white transition-all shadow-2xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                            #{index + 1} {block.type}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setEditingBlock(block); setShowEditModal(true); }}
                                                className="text-xs text-indigo-600 hover:underline font-bold"
                                            >
                                                Edit Style / Text
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeBlock(block.id)}
                                                className="text-xs text-rose-600 hover:underline font-bold"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-slate-800">
                                        {block.type === "image" && block.content ? (
                                            <img src={block.content} alt="Block" className="max-h-48 rounded-lg object-cover" />
                                        ) : (
                                            <p className="whitespace-pre-wrap">{block.content || "Empty content"}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Save / Publish actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={savingBlog}
                            onClick={() => handleSaveBlog(false)}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            Save Draft
                        </button>
                        <button
                            type="button"
                            disabled={savingBlog}
                            onClick={() => handleSaveBlog(true)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[16px]">publish</span>
                            Publish Blog Post
                        </button>
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
