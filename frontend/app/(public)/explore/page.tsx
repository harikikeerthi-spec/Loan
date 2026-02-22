"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ForumPost } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
            <Navbar />

            <div className="pt-28 pb-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#6605c7] to-purple-700 text-white py-16 px-6 mb-10">
                    <div className="max-w-5xl mx-auto text-center">
                        <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest mb-4">Community Hub</span>
                        <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Student Discussions</h1>
                        <p className="text-purple-100 text-lg mb-8">Ask questions, share experiences, and get advice from fellow students.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {isAuthenticated ? (
                                <Link href="/explore/create-post" className="px-8 py-3 bg-white text-[#6605c7] font-bold rounded-xl hover:bg-gray-50 transition-all inline-flex items-center gap-2">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Ask a Question
                                </Link>
                            ) : (
                                <Link href="/login?redirect=/explore/create-post" className="px-8 py-3 bg-white text-[#6605c7] font-bold rounded-xl hover:bg-gray-50 transition-all">
                                    Join & Ask
                                </Link>
                            )}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search discussions..."
                                    className="pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/30 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="lg:w-64 shrink-0">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 sticky top-28">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 px-3 mb-3">Topics</h3>
                                <nav className="space-y-1">
                                    {topics.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setActiveTopic(t.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTopic === t.id
                                                    ? "bg-[#6605c7] text-white"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
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
                                        <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : !filtered.length ? (
                                <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl">
                                    <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">forum</span>
                                    <h3 className="text-xl font-bold dark:text-white mb-2">No discussions yet</h3>
                                    <p className="text-gray-500 mb-6">Be the first to start a conversation!</p>
                                    {isAuthenticated && (
                                        <Link href="/explore/create-post" className="px-6 py-3 bg-[#6605c7] text-white font-bold rounded-xl">Ask a Question</Link>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filtered.map((post) => (
                                        <Link key={post.id} href={`/explore/${post.slug || post.id}`} className="block group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-[#6605c7]/20 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-[#6605c7]/10 rounded-xl flex items-center justify-center text-[#6605c7] shrink-0">
                                                    <span className="material-symbols-outlined text-lg">chat_bubble</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#6605c7] transition-colors leading-tight">
                                                            {post.title}
                                                        </h3>
                                                        {post.isPinned && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase shrink-0">Pinned</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{post.content}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
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
            <Footer />
        </div>
    );
}
