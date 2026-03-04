"use client";

import { useState, useEffect, DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";

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
    { type: "heading", label: "Heading", icon: "title", color: "blue", desc: "Drag to add" },
    { type: "container", label: "Container", icon: "view_agenda", color: "purple", desc: "Drag to add" },
    { type: "text", label: "Text Box", icon: "text_fields", color: "green", desc: "Drag to add" },
    { type: "image", label: "Image", icon: "image", color: "orange", desc: "Drag to add" },
    { type: "video", label: "Video", icon: "videocam", color: "red", desc: "Drag to add" },
    { type: "button", label: "Button", icon: "smart_button", color: "indigo", desc: "Drag to add" },
    { type: "list", label: "List", icon: "format_list_bulleted", color: "teal", desc: "Drag to add" },
    { type: "quote", label: "Quote", icon: "format_quote", color: "yellow", desc: "Drag to add" },
    { type: "code", label: "Code Block", icon: "code", color: "gray", desc: "Drag to add" },
    { type: "divider", label: "Divider", icon: "horizontal_rule", color: "pink", desc: "Drag to add" },
    { type: "spacer", label: "Spacer", icon: "unfold_more", color: "cyan", desc: "Drag to add" },
];

const COLOR_MAP: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    indigo: "bg-indigo-100 text-indigo-600",
    teal: "bg-teal-100 text-teal-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray: "bg-gray-100 text-gray-600",
    pink: "bg-pink-100 text-pink-600",
    cyan: "bg-cyan-100 text-cyan-600",
};

const TEMPLATES = [
    { id: "basic", name: "Basic Article", desc: "Title + Image + Text" },
    { id: "multimedia", name: "Multimedia", desc: "Images + Videos + CTA" },
    { id: "tutorial", name: "Tutorial", desc: "Steps + Screenshots" },
];

export default function CreateBlogPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Blog settings
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState("Education");
    const [author, setAuthor] = useState(user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "");
    const [tags, setTags] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPublished, setIsPublished] = useState(true);
    const [enableComments, setEnableComments] = useState(true);

    // Editor state
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [draggedType, setDraggedType] = useState<BlockType | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState("Saved");
    const [loading, setLoading] = useState(false);

    // Modal state
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Generate slug from title
    useEffect(() => {
        const generated = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        setSlug(generated);
    }, [title]);

    // Set current date
    const currentDate = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Create new block
    const createBlock = (type: BlockType): Block => {
        const defaults: Record<BlockType, string> = {
            heading: "New Heading",
            container: "",
            text: "Enter your text here...",
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800",
            video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            button: "Click Here",
            list: "• Item 1\n• Item 2\n• Item 3",
            quote: "Enter an inspiring quote here...",
            code: "// Your code here\nconsole.log('Hello World');",
            divider: "",
            spacer: "",
        };
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type,
            content: defaults[type],
        };
    };

    // Drag handlers for sidebar elements
    const handleDragStart = (e: DragEvent, type: BlockType) => {
        setDraggedType(type);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDragEnd = () => {
        setDraggedType(null);
        setDragOverIndex(null);
    };

    // Drag handlers for reordering blocks
    const handleBlockDragStart = (e: DragEvent, blockId: string) => {
        setDraggingBlockId(blockId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleBlockDragEnd = () => {
        setDraggingBlockId(null);
        setDragOverIndex(null);
    };

    // Canvas drop zone handlers
    const handleCanvasDragOver = (e: DragEvent, index?: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = draggedType ? "copy" : "move";
        setDragOverIndex(index ?? blocks.length);
    };

    const handleCanvasDrop = (e: DragEvent, index?: number) => {
        e.preventDefault();
        const dropIndex = index ?? blocks.length;

        if (draggedType) {
            // Adding new element from sidebar
            const newBlock = createBlock(draggedType);
            const newBlocks = [...blocks];
            newBlocks.splice(dropIndex, 0, newBlock);
            setBlocks(newBlocks);
            setSaveStatus("Unsaved");
        } else if (draggingBlockId) {
            // Reordering existing block
            const fromIndex = blocks.findIndex((b) => b.id === draggingBlockId);
            if (fromIndex !== -1 && fromIndex !== dropIndex) {
                const newBlocks = [...blocks];
                const [removed] = newBlocks.splice(fromIndex, 1);
                const adjustedIndex = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
                newBlocks.splice(adjustedIndex, 0, removed);
                setBlocks(newBlocks);
                setSaveStatus("Unsaved");
            }
        }

        setDraggedType(null);
        setDraggingBlockId(null);
        setDragOverIndex(null);
    };

    // Block operations
    const updateBlock = (id: string, content: string) => {
        setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
        setSaveStatus("Unsaved");
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter((b) => b.id !== id));
        setSaveStatus("Unsaved");
    };

    const duplicateBlock = (id: string) => {
        const index = blocks.findIndex((b) => b.id === id);
        if (index !== -1) {
            const newBlock = { ...blocks[index], id: Date.now().toString() };
            const newBlocks = [...blocks];
            newBlocks.splice(index + 1, 0, newBlock);
            setBlocks(newBlocks);
            setSaveStatus("Unsaved");
        }
    };

    const openEditModal = (block: Block) => {
        setEditingBlock({ ...block });
        setShowModal(true);
    };

    const saveEditModal = () => {
        if (editingBlock) {
            setBlocks(blocks.map((b) => (b.id === editingBlock.id ? editingBlock : b)));
            setSaveStatus("Unsaved");
        }
        setShowModal(false);
        setEditingBlock(null);
    };

    // Load template
    const loadTemplate = (templateId: string) => {
        let templateBlocks: Block[] = [];
        if (templateId === "basic") {
            templateBlocks = [
                createBlock("heading"),
                createBlock("image"),
                createBlock("text"),
                createBlock("text"),
            ];
        } else if (templateId === "multimedia") {
            templateBlocks = [
                createBlock("heading"),
                createBlock("image"),
                createBlock("text"),
                createBlock("video"),
                createBlock("button"),
            ];
        } else if (templateId === "tutorial") {
            templateBlocks = [
                createBlock("heading"),
                createBlock("text"),
                createBlock("image"),
                createBlock("list"),
                createBlock("code"),
                createBlock("divider"),
                createBlock("text"),
            ];
        }
        setBlocks(templateBlocks);
        setSaveStatus("Unsaved");
    };

    // Auto-save simulation
    const autoSave = () => {
        setSaveStatus("Saving...");
        setTimeout(() => setSaveStatus("Saved"), 1000);
    };

    // Preview blog
    const previewBlog = () => {
        alert("Preview functionality - would open blog preview");
    };

    // Publish blog
    const handlePublish = async () => {
        if (!title.trim()) {
            alert("Please enter a blog title.");
            return;
        }
        if (blocks.length === 0) {
            alert("Please add some content to your blog.");
            return;
        }

        setLoading(true);
        try {
            const htmlContent = blocks
                .map((b) => {
                    switch (b.type) {
                        case "heading":
                            return `<h2 class="text-3xl font-bold mt-8 mb-4">${b.content}</h2>`;
                        case "text":
                            return `<p class="text-lg leading-relaxed text-gray-700 mb-4">${b.content}</p>`;
                        case "image":
                            return `<img src="${b.content}" class="w-full rounded-2xl my-8 object-cover shadow-lg" alt="Blog Image" />`;
                        case "video":
                            return `<div class="my-8 aspect-video"><iframe src="${b.content}" class="w-full h-full rounded-2xl" frameborder="0" allowfullscreen></iframe></div>`;
                        case "button":
                            return `<div class="my-6"><a href="#" class="inline-block px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors">${b.content}</a></div>`;
                        case "list":
                            const items = b.content.split("\n").map((item) => `<li>${item.replace(/^[•\-]\s*/, "")}</li>`).join("");
                            return `<ul class="list-disc list-inside my-4 space-y-2 text-gray-700">${items}</ul>`;
                        case "quote":
                            return `<blockquote class="border-l-4 border-purple-500 pl-6 py-4 italic text-xl text-gray-600 my-8 bg-purple-50 rounded-r-xl">"${b.content}"</blockquote>`;
                        case "code":
                            return `<pre class="bg-gray-900 text-green-400 p-6 rounded-xl my-6 overflow-x-auto"><code>${b.content}</code></pre>`;
                        case "divider":
                            return `<hr class="my-10 border-gray-200" />`;
                        case "spacer":
                            return `<div class="h-12"></div>`;
                        case "container":
                            return `<div class="p-6 bg-gray-50 rounded-xl my-6">${b.content}</div>`;
                        default:
                            return "";
                    }
                })
                .join("");

            const blogData = {
                title,
                slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                category,
                authorName: author,
                content: htmlContent,
                isPublished,
                isFeatured,
                featuredImage: blocks.find((b) => b.type === "image")?.content || "",
                excerpt: excerpt || blocks.find((b) => b.type === "text")?.content?.substring(0, 150) + "...",
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            };

            const res: any = await adminApi.createBlog(blogData);
            if (res.success) {
                alert("Blog published successfully!");
                router.push("/admin");
            } else {
                alert(res.message || "Failed to publish blog");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred while publishing.");
        } finally {
            setLoading(false);
        }
    };

    // Render block content for canvas
    const renderBlockContent = (block: Block) => {
        switch (block.type) {
            case "heading":
                return (
                    <h2
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                        className="text-3xl font-bold outline-none"
                    >
                        {block.content}
                    </h2>
                );
            case "text":
                return (
                    <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                        className="text-lg leading-relaxed text-gray-700 outline-none"
                    >
                        {block.content}
                    </p>
                );
            case "image":
                return (
                    <div className="relative group/img">
                        <img src={block.content} alt="Blog" className="w-full rounded-xl object-cover max-h-[400px]" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                className="w-3/4 px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-sm border border-white/30 outline-none"
                                placeholder="Paste image URL..."
                            />
                        </div>
                    </div>
                );
            case "video":
                return (
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <iframe src={block.content} className="w-full h-full" allowFullScreen />
                    </div>
                );
            case "button":
                return (
                    <button
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl outline-none"
                    >
                        {block.content}
                    </button>
                );
            case "list":
                return (
                    <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        className="w-full text-gray-700 outline-none resize-none min-h-[100px] bg-transparent"
                        placeholder="• Item 1&#10;• Item 2&#10;• Item 3"
                    />
                );
            case "quote":
                return (
                    <blockquote className="border-l-4 border-purple-500 pl-6 py-2 bg-purple-50/50 rounded-r-xl">
                        <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                            className="text-xl italic text-gray-600 outline-none"
                        >
                            "{block.content}"
                        </p>
                    </blockquote>
                );
            case "code":
                return (
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto">
                        <code
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateBlock(block.id, e.currentTarget.textContent || "")}
                            className="outline-none block"
                        >
                            {block.content}
                        </code>
                    </pre>
                );
            case "divider":
                return <hr className="border-gray-300 my-4" />;
            case "spacer":
                return <div className="h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">Spacer</div>;
            case "container":
                return (
                    <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Container - Drop elements here</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <header className="h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 text-white flex items-center justify-between px-6 shadow-lg flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="hidden sm:inline">Back to Dashboard</span>
                    </Link>
                    <h1 className="text-xl font-bold hidden md:block">✨ Create Blog Post - Canva Studio</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={autoSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                        title="Auto-save enabled"
                    >
                        <span className="material-symbols-outlined">cloud_sync</span>
                        <span className="hidden sm:inline">{saveStatus}</span>
                    </button>
                    <button
                        onClick={previewBlog}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">visibility</span>
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">publish</span>
                        <span>{loading ? "Publishing..." : "Publish"}</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-[300px] bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                    <div className="p-4">
                        {/* Templates Section */}
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">📐 Templates</h2>
                            <div className="space-y-2">
                                {TEMPLATES.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => loadTemplate(t.id)}
                                        className="border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-indigo-400 hover:scale-[1.02] transition-all"
                                    >
                                        <p className="font-medium text-sm">{t.name}</p>
                                        <p className="text-xs text-gray-500">{t.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Elements Section */}
                        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">🎨 Elements (Drag to Canvas)</h2>
                        <div className="space-y-2">
                            {ELEMENT_TYPES.map((el) => (
                                <div
                                    key={el.type}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, el.type)}
                                    onDragEnd={handleDragEnd}
                                    className="flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-50 hover:translate-x-1 transition-all"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLOR_MAP[el.color]}`}>
                                        <span className="material-symbols-outlined">{el.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{el.label}</p>
                                        <p className="text-xs text-gray-500">{el.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <hr className="my-4" />

                        {/* Blog Settings */}
                        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">⚙️ Blog Settings</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700">Blog Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter title..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700">Slug (Auto-generated) *</label>
                                <input
                                    type="text"
                                    value={slug}
                                    readOnly
                                    placeholder="auto-generated-from-title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700">Category *</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-200 outline-none"
                                >
                                    <option>Education</option>
                                    <option>Finance</option>
                                    <option>Technology</option>
                                    <option>News</option>
                                    <option>Tips & Guides</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700">Author *</label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="Author name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700">Tags</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="tag1, tag2, tag3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700">Excerpt</label>
                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Short description..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1 resize-none focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm">Mark as featured</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPublished}
                                    onChange={(e) => setIsPublished(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm">Publish immediately</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enableComments}
                                    onChange={(e) => setEnableComments(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm">Enable comments</span>
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Main Canvas Area */}
                <main
                    className="flex-1 bg-gray-100 overflow-y-auto flex justify-center p-6 md:p-10"
                    onDragOver={(e) => handleCanvasDragOver(e)}
                    onDrop={(e) => handleCanvasDrop(e)}
                >
                    <div className="w-full max-w-[900px] bg-white min-h-[1200px] shadow-lg p-10 md:p-16">
                        {/* Canvas Header */}
                        <div className="text-center mb-12 pb-6 border-b border-gray-200">
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                {title || "Your Blog Title"}
                            </h1>
                            <p className="text-gray-500">
                                <span>{author || "Author Name"}</span> • <span>{currentDate}</span>
                            </p>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[400px]">
                            {blocks.length === 0 ? (
                                <div className="text-center text-gray-400 py-20">
                                    <span className="material-symbols-outlined text-6xl mb-4 block">edit_note</span>
                                    <p className="text-lg font-medium">Drag elements from the sidebar</p>
                                    <p className="text-sm mt-2">Or choose a template to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {blocks.map((block, index) => (
                                        <div
                                            key={block.id}
                                            draggable
                                            onDragStart={(e) => handleBlockDragStart(e, block.id)}
                                            onDragEnd={handleBlockDragEnd}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOverIndex(index);
                                            }}
                                            onDrop={(e) => handleCanvasDrop(e, index)}
                                            className={`relative group p-5 border-2 border-dashed rounded-lg transition-all cursor-move
                                                ${draggingBlockId === block.id ? "opacity-50" : ""}
                                                ${dragOverIndex === index ? "border-green-400 bg-green-50" : "border-transparent hover:border-indigo-400 hover:bg-indigo-50/30"}
                                            `}
                                        >
                                            {/* Block Controls */}
                                            <div className="absolute -top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={() => openEditModal(block)}
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs shadow hover:bg-gray-50"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => duplicateBlock(block.id)}
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs shadow hover:bg-gray-50"
                                                >
                                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                                </button>
                                                <button
                                                    onClick={() => removeBlock(block.id)}
                                                    className="px-2 py-1 bg-white border border-red-200 rounded text-xs shadow hover:bg-red-50 text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>

                                            {renderBlockContent(block)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Edit Modal */}
            {showModal && editingBlock && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="text-xl font-bold">Edit {editingBlock.type.charAt(0).toUpperCase() + editingBlock.type.slice(1)}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="material-symbols-outlined text-2xl cursor-pointer hover:text-red-600"
                            >
                                close
                            </button>
                        </div>
                        <div className="p-6">
                            {editingBlock.type === "image" || editingBlock.type === "video" ? (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        {editingBlock.type === "image" ? "Image URL" : "Video Embed URL"}
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBlock.content}
                                        onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                                        placeholder={editingBlock.type === "image" ? "https://example.com/image.jpg" : "https://youtube.com/embed/..."}
                                    />
                                    {editingBlock.type === "image" && editingBlock.content && (
                                        <img src={editingBlock.content} alt="Preview" className="mt-4 rounded-lg max-h-64 object-cover" />
                                    )}
                                </div>
                            ) : editingBlock.type === "divider" || editingBlock.type === "spacer" ? (
                                <p className="text-gray-500">This element has no editable content.</p>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Content</label>
                                    <textarea
                                        value={editingBlock.content}
                                        onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none min-h-[200px] resize-none"
                                        placeholder="Enter content..."
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEditModal}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
