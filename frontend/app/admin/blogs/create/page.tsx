"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { adminApi } from "@/lib/api";

interface Block {
    id: string;
    type: "heading" | "text" | "image" | "quote" | "divider";
    content: string;
}

export default function CreateBlogPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Education");
    const [author, setAuthor] = useState(user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "");
    const [isPublished, setIsPublished] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([
        { id: "1", type: "heading", content: "New Blog Post" },
        { id: "2", type: "text", content: "Start writing your amazing content here..." }
    ]);
    const [loading, setLoading] = useState(false);

    const addBlock = (type: Block["type"]) => {
        const newBlock: Block = {
            id: Date.now().toString(),
            type,
            content: type === "heading" ? "New Section" :
                type === "text" ? "Enter text..." :
                    type === "quote" ? "Enter quote..." :
                        type === "image" ? "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070" :
                            ""
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, content: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (id: string, direction: "up" | "down") => {
        const index = blocks.findIndex(b => b.id === id);
        if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) return;

        const newBlocks = [...blocks];
        const sapIndex = direction === "up" ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[sapIndex]] = [newBlocks[sapIndex], newBlocks[index]];
        setBlocks(newBlocks);
    };

    const handlePublish = async () => {
        if (!title || blocks.length === 0) {
            alert("Please enter a title and some content.");
            return;
        }

        setLoading(true);
        try {
            // Convert blocks to HTML or a structured content string
            const htmlContent = blocks.map(b => {
                if (b.type === "heading") return `<h2 class="text-2xl font-bold mt-8 mb-4">${b.content}</h2>`;
                if (b.type === "text") return `<p class="text-lg leading-relaxed text-gray-700 mb-4">${b.content}</p>`;
                if (b.type === "image") return `<img src="${b.content}" class="w-full rounded-3xl my-8 object-cover shadow-xl" alt="Blog Image" />`;
                if (b.type === "quote") return `<blockquote class="border-l-4 border-primary pl-6 py-4 italic text-2xl text-gray-600 my-8">"${b.content}"</blockquote>`;
                if (b.type === "divider") return `<hr class="my-10 border-gray-100" />`;
                return "";
            }).join("");

            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const blogData = {
                title,
                slug,
                category,
                authorName: author,
                content: htmlContent,
                isPublished,
                isFeatured,
                featuredImage: blocks.find(b => b.type === "image")?.content || "",
                excerpt: blocks.find(b => b.type === "text")?.content?.substring(0, 150) + "..."
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

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Toolbar */}
            <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="p-2 hover:bg-gray-100:bg-slate-800 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-gray-500">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Canva Studio</h1>
                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Blog Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <p className="text-xs font-bold text-gray-400">STATUS</p>
                        <p className="text-sm font-bold text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Live Sync
                        </p>
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Publishing..." : "Publish Blog"}
                        <span className="material-symbols-outlined text-sm">publish</span>
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-80px)] overflow-hidden">
                {/* Editor Sidebar */}
                <aside className="w-80 bg-white border-r border-gray-100 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Core Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">BLOG TITLE</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter title..."
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none border-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">CATEGORY</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none border-none"
                                >
                                    <option>Education</option>
                                    <option>Finance</option>
                                    <option>Study Abroad</option>
                                    <option>Success Stories</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer" onClick={() => setIsFeatured(!isFeatured)}>
                                <span className="text-sm font-bold">Featured Post</span>
                                <div className={`w-10 h-6 rounded-full transition-colors relative ${isFeatured ? 'bg-primary' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isFeatured ? 'left-5' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Add Elements</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addBlock("heading")} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">title</span>
                                <span className="text-[10px] font-bold">Heading</span>
                            </button>
                            <button onClick={() => addBlock("text")} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">notes</span>
                                <span className="text-[10px] font-bold">Paragraph</span>
                            </button>
                            <button onClick={() => addBlock("image")} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">image</span>
                                <span className="text-[10px] font-bold">Image</span>
                            </button>
                            <button onClick={() => addBlock("quote")} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">format_quote</span>
                                <span className="text-[10px] font-bold">Quote</span>
                            </button>
                        </div>
                    </section>
                </aside>

                {/* Canvas Area */}
                <main className="flex-1 bg-gray-100 overflow-y-auto p-4 md:p-12 custom-scrollbar flex justify-center">
                    <div className="w-full max-w-4xl bg-white min-h-[1200px] rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 p-12 md:p-20 relative">
                        {/* Blog Header Preview */}
                        <div className="text-center mb-16 space-y-4">
                            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">{category}</span>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                                {title || "Untitled Masterpiece"}
                            </h1>
                            <div className="flex items-center justify-center gap-3 text-gray-500 font-medium pt-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{author[0]}</div>
                                <span>{author}</span>
                                <span>•</span>
                                <span>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Editable Blocks */}
                        <div className="space-y-4">
                            {blocks.map((block) => (
                                <div key={block.id} className="group relative">
                                    {/* Block Controls */}
                                    <div className="absolute -left-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveBlock(block.id, "up")} className="p-1.5 hover:bg-gray-100:bg-slate-800 rounded-lg text-gray-400"><span className="material-symbols-outlined text-lg">arrow_upward</span></button>
                                        <button onClick={() => moveBlock(block.id, "down")} className="p-1.5 hover:bg-gray-100:bg-slate-800 rounded-lg text-gray-400"><span className="material-symbols-outlined text-lg">arrow_downward</span></button>
                                        <button onClick={() => removeBlock(block.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><span className="material-symbols-outlined text-lg">delete</span></button>
                                    </div>

                                    {block.type === "heading" && (
                                        <input
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                            className="w-full text-2xl font-bold bg-transparent outline-none border-none py-2"
                                            placeholder="Enter section heading..."
                                        />
                                    )}

                                    {block.type === "text" && (
                                        <textarea
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                            className="w-full text-lg leading-relaxed text-gray-700 bg-transparent outline-none border-none py-2 resize-none min-h-[100px]"
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = 'inherit';
                                                target.style.height = `${target.scrollHeight}px`;
                                            }}
                                            placeholder="Start writing..."
                                        />
                                    )}

                                    {block.type === "image" && (
                                        <div className="my-8">
                                            <div className="relative rounded-3xl overflow-hidden group/img">
                                                <img src={block.content} className="w-full object-cover max-h-[500px]" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <input
                                                        type="text"
                                                        value={block.content}
                                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                                        className="w-3/4 p-3 bg-white/20 backdrop-blur-md rounded-xl text-white text-sm border-none outline-none focus:ring-2 focus:ring-white/50"
                                                        placeholder="Paste image URL..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {block.type === "quote" && (
                                        <div className="border-l-4 border-primary pl-6 py-4 my-8">
                                            <textarea
                                                value={block.content}
                                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                                className="w-full text-2xl font-medium italic text-gray-600 bg-transparent outline-none border-none py-2 resize-none"
                                                placeholder="Enter quote..."
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Block Hint */}
                        {blocks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-100 rounded-3xl">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">edit_note</span>
                                <p className="text-gray-400 font-bold">Your canvas is empty</p>
                                <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">Add elements from the sidebar</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
