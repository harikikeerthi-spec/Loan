"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ForumPost } from "@/types";

const topics = [
    { id: "all", label: "All Discussions", icon: "forum" },
    { id: "loan", label: "Loan Questions", icon: "account_balance" },
    { id: "visa", label: "Visa & Immigration", icon: "flight_takeoff" },
    { id: "university", label: "University Advice", icon: "school" },
    { id: "career", label: "Career & ROI", icon: "trending_up" },
    { id: "general", label: "General", icon: "chat_bubble" },
];

export default function ExplorePage() {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTopic, setActiveTopic] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await communityApi.getPosts(activeTopic === "all" ? undefined : activeTopic) as {
                    posts?: ForumPost[]; data?: ForumPost[];
                };
                setPosts(data?.posts || data?.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [activeTopic]);

    const filtered = posts.filter((p) =>
        !search || p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-transparent">
            <div className="pt-28 pb-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#6605c7] to-purple-700 text-white py-16 px-6 mb-10">
                    <div className="max-w-5xl mx-auto text-center">
                        <span className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[11px] font-bold uppercase tracking-widest mb-4">Community Hub</span>
                        <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Student Discussions</h1>
                        <p className="text-purple-100 text-[18px] mb-8">Ask questions, share experiences, and get advice from fellow students.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {isAuthenticated ? (
                                <Link href="/explore/create-post" className="px-8 py-3.5 bg-white text-[#6605c7] text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all inline-flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    Ask a Question
                                </Link>
                            ) : (
                                <Link href="/login?redirect=/explore/create-post" className="px-8 py-3.5 bg-white text-[#6605c7] text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all shadow-lg">
                                    Join & Ask
                                </Link>
                            )}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search discussions..."
                                    className="pl-12 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/30 w-64 text-[13px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="lg:w-64 shrink-0">
                            <div className="bg-white rounded-xl p-4 border border-gray-100 sticky top-28 shadow-sm">
                                <h3 className="font-bold text-[11px] uppercase tracking-widest text-gray-400 px-3 mb-4">Topics</h3>
                                <nav className="space-y-1">
                                    {topics.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setActiveTopic(t.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${activeTopic === t.id
                                                    ? "bg-[#6605c7] text-white shadow-md shadow-purple-500/20"
                                                    : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">{t.icon}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* Main */}
                        <main className="flex-1">
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-gray-100" />
                                    ))}
                                </div>
                            ) : !filtered.length ? (
                                <div className="text-center py-24 bg-white rounded-xl border border-gray-100">
                                    <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">forum</span>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">No discussions yet</h3>
                                    <p className="text-[13px] text-gray-500 mb-6">Be the first to start a conversation!</p>
                                    {isAuthenticated && (
                                        <Link href="/explore/create-post" className="px-8 py-3.5 bg-[#6605c7] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#5504a6] transition-all shadow-lg shadow-purple-500/20">Ask a Question</Link>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filtered.map((post) => (
                                        <Link key={post.id} href={`/explore/${post.slug || post.id}`} className="block group bg-white rounded-xl p-6 border border-gray-100 hover:shadow-xl hover:border-[#6605c7]/20 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-[#6605c7]/[0.05] rounded-xl flex items-center justify-center text-[#6605c7] shrink-0">
                                                    <span className="material-symbols-outlined text-lg">chat_bubble</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-[#6605c7] transition-colors leading-tight text-[15px]">
                                                            {post.title}
                                                        </h3>
                                                        {post.isPinned && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-xl font-bold uppercase shrink-0">Pinned</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500 text-[13px] line-clamp-2 mb-4 leading-relaxed">{post.content}</p>
                                                    <div className="flex items-center gap-4 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">person</span>
                                                            {post.author?.firstName || "User"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">favorite</span>
                                                            {post.likes || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">comment</span>
                                                            {post._count?.comments || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                                            {new Date(post.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
