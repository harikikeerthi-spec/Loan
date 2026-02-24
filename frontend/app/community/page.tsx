"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { communityApi } from "@/lib/api";
import CreatePostModal from "@/components/CreatePostModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ForumPost {
    id: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    author?: { firstName?: string; lastName?: string; name?: string; email?: string } | string;
    createdAt?: string;
    _count?: { comments?: number };
    likeCount?: number;
    commentCount?: number;
    isPinned?: boolean;
}

interface Stats {
    mentors?: number;
    forumPosts?: number;
    stories?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function authorName(a: ForumPost["author"]): string {
    if (!a) return "Anonymous";
    if (typeof a === "string") return a;
    if (a.firstName) return `${a.firstName} ${a.lastName || ""}`.trim();
    return a.name || a.email?.split("@")[0] || "Anonymous";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityHubPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [stats, setStats] = useState<Stats>({});
    const [postsLoading, setPostsLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [sort, setSort] = useState<"latest" | "popular">("latest");

    // Fetch discussions
    useEffect(() => {
        setPostsLoading(true);
        communityApi
            .getForumPosts({ sort, limit: 6 })
            .then((res: any) => {
                const list = Array.isArray(res) ? res : res?.data || [];
                setPosts(list);
            })
            .catch(() => setPosts([]))
            .finally(() => setPostsLoading(false));
    }, [sort]);

    // Fetch stats
    useEffect(() => {
        communityApi
            .getStats()
            .then((res: any) => setStats(res?.data || {}))
            .catch(() => { });
    }, []);

    const TRENDING_TAGS = [
        { label: "#Education", href: "/community/discussions?tag=Education" },
        { label: "#StudyAbroad", href: "/community/discussions?tag=StudyAbroad" },
        { label: "#StudentLoans", href: "/community/discussions?tag=StudentLoans" },
        { label: "#VisaUpdates", href: "/community/discussions?tag=VisaUpdates" },
        { label: "#Scholarships", href: "/community/discussions?tag=Scholarships" },
        { label: "#GREPrep", href: "/community/discussions?tag=GREPrep" },
        { label: "#Masters2026", href: "/community/discussions?category=General" },
        { label: "#Admissions", href: "/community/discussions?tag=Admissions" },
    ];

    return (
        <main className="relative min-h-screen font-sans" style={{ background: "#f7f5f8" }}>
            {/* ── Background ─────────────────────────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#f7f5f8" }}>
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(at 0% 0%, rgba(102,5,199,0.4) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(224,195,137,0.5) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139,192,232,0.4) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(102,5,199,0.3) 0px, transparent 50%)",
                        opacity: 0.9,
                    }}
                />
            </div>

            {/* ── Styles ────────────────────────────────────────────────────── */}
            <style>{`
                .ch-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); }
                .ch-tag { display:inline-flex; padding:6px 14px; border-radius:99px; background:rgba(255,255,255,0.4); border:1px solid rgba(255,255,255,0.6); font-size:11px; font-weight:700; color:#6605c7; transition:all 0.3s cubic-bezier(0.16,1,0.3,1); backdrop-filter:blur(8px); text-decoration:none; }
                .ch-tag:hover { transform:translateY(-2px); background:#6605c7; color:white; box-shadow:0 10px 20px rgba(102,5,199,0.15); border-color:#6605c7; }
                .animated-text { background:linear-gradient(90deg,#6605c7,#a855f7,#6605c7); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:ch-shine 3s linear infinite; }
                @keyframes ch-shine { to { background-position:200% center; } }
                .ch-cat-item { position:relative; overflow:hidden; transition:all 0.5s cubic-bezier(0.4,0,0.2,1); border-radius:2.5rem; }
                .ch-cat-item:hover { transform:scale(1.02); }
                .ch-cat-img { transition:transform 0.8s ease; width:100%; height:100%; object-fit:cover; }
                .ch-cat-item:hover .ch-cat-img { transform:scale(1.1); }
                .ch-cat-overlay { background:linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); position:absolute; inset:0; }
                .ch-stat-card { text-align:center; }
                .ch-stat-card:hover h3 { transform:scale(1.1); }
                .ch-stat-card h3 { transition:transform 0.2s; }
                .ch-post-card { background:white; border:1.5px solid #f3f4f6; border-radius:16px; padding:20px 22px; transition:all 0.2s; display:block; text-decoration:none; }
                .ch-post-card:hover { border-color:#e9d5ff; box-shadow:0 8px 24px rgba(102,5,199,0.08); transform:translateY(-2px); }
                .ch-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; color:white; font-weight:800; font-size:16px; flex-shrink:0; }
                .ch-badge { display:inline-block; padding:3px 10px; border-radius:9999px; font-size:10.5px; font-weight:700; background:#f3e8ff; color:#7e22ce; }
                .ch-sort-btn { padding:6px 16px; border-radius:9999px; border:1.5px solid #e5e7eb; background:white; font-size:12px; font-weight:700; color:#6b7280; cursor:pointer; transition:all 0.15s; }
                .ch-sort-btn.active { background:#6605c7; color:white; border-color:#6605c7; }
                .skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:shimmer 1.2s infinite; border-radius:12px; }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .quick-topic { padding:8px 14px; border-radius:12px; background:white; border:1px solid #e5e7eb; font-size:12px; font-weight:700; color:#374151; text-decoration:none; transition:all 0.15s; display:inline-block; }
                .quick-topic:hover { border-color:#6605c7; color:#6605c7; }
            `}</style>

            <div className="relative z-10 pt-28 pb-24">
                <div className="max-w-7xl mx-auto px-6">

                    {/* ── Hero ──────────────────────────────────────────────── */}
                    <section className="text-center mb-20">
                        <span
                            className="inline-block px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
                            style={{ background: "rgba(102,5,199,0.1)", color: "#6605c7" }}
                        >
                            The Global Hub
                        </span>
                        <h1
                            className="text-5xl md:text-7xl font-bold mb-12"
                            style={{ fontFamily: "'Noto Serif', serif", color: "#111827" }}
                        >
                            Join the{" "}
                            <span className="animated-text">Community</span>
                        </h1>

                        {/* Stats Bar */}
                        <div
                            className="ch-glass flex flex-wrap justify-center gap-8 md:gap-16 py-8 px-10 rounded-[2.5rem] max-w-5xl mx-auto mb-16"
                        >
                            {[
                                { label: "Total Members", value: "12.5k+" },
                                { label: "Daily Topics", value: "450+" },
                                { label: "Verified Mentors", value: `${stats.mentors || "85"}+` },
                                { label: "Success Stories", value: `${stats.stories ? `${stats.stories}+` : "2.1k+"}` },
                            ].map((s) => (
                                <div key={s.label} className="ch-stat-card">
                                    <p
                                        className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                                        style={{ color: "#6605c7" }}
                                    >
                                        {s.label}
                                    </p>
                                    <h3 className="text-3xl font-bold" style={{ fontFamily: "'Noto Serif', serif" }}>
                                        {s.value}
                                    </h3>
                                </div>
                            ))}
                        </div>

                        {/* Trending Tags */}
                        <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto mb-16">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2 flex items-center gap-2">
                                🔥 Trending:
                            </span>
                            {TRENDING_TAGS.map((t) => (
                                <Link key={t.label} href={t.href} className="ch-tag">
                                    {t.label}
                                </Link>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5"
                                style={{
                                    background: "linear-gradient(135deg,#7c3aed,#6605c7)",
                                    boxShadow: "0 8px 24px rgba(102,5,199,0.3)",
                                }}
                            >
                                ✍️ Post a Question
                            </button>
                            <Link
                                href="/community/discussions"
                                className="px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:-translate-y-0.5"
                                style={{ borderColor: "#e9d5ff", color: "#7c3aed", background: "rgba(255,255,255,0.6)" }}
                            >
                                Browse All Discussions →
                            </Link>
                        </div>
                    </section>

                    {/* ── Trending Now + Most Popular ───────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">

                        {/* Trending Now */}
                        <div className="ch-glass p-10 rounded-[3rem] relative overflow-hidden">
                            <div
                                className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
                                style={{ background: "rgba(239,68,68,0.05)" }}
                            />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                                    >
                                        📈
                                    </div>
                                    <h2 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif', serif" }}>
                                        Trending Now
                                    </h2>
                                </div>
                                <span
                                    className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
                                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                                >
                                    🔴 Live
                                </span>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { n: "01", title: "Massive Visa Slot Opening - Mumbai Consulate", meta: "1.2k Active · 85+ New", href: "/community/discussions?tag=VisaUpdates" },
                                    { n: "02", title: "Avoiding Loan Rejection: Top 5 Mistakes", meta: "4.5k Views · 2m ago", href: "/community/discussions?tag=Loans" },
                                    { n: "03", title: "IELTS Speaking Topics - Feb 2026 Collection", meta: "⭐ Featured Topic", href: "/community/discussions?tag=IELTS" },
                                ].map((item) => (
                                    <Link key={item.n} href={item.href} className="block group" style={{ textDecoration: "none" }}>
                                        <div className="flex items-start gap-5">
                                            <div
                                                className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-bold text-xl transition-all"
                                                style={{ background: "#f4f4f5", color: "#9ca3af" }}
                                                onMouseOver={(e) => {
                                                    (e.currentTarget as HTMLElement).style.background = "#6605c7";
                                                    (e.currentTarget as HTMLElement).style.color = "white";
                                                }}
                                                onMouseOut={(e) => {
                                                    (e.currentTarget as HTMLElement).style.background = "#f4f4f5";
                                                    (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                                                }}
                                            >
                                                {item.n}
                                            </div>
                                            <div className="flex-1 border-b pb-6" style={{ borderColor: "#f3f4f6" }}>
                                                <h4 className="font-bold text-gray-900 mb-1 transition-colors group-hover:text-[#6605c7]">
                                                    {item.title}
                                                </h4>
                                                <p className="text-[10px] font-bold text-gray-400">{item.meta}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Live Feed */}
                        <div className="ch-glass p-10 rounded-[3rem] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                                    >
                                        ⭐
                                    </div>
                                    <h2 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif', serif" }}>
                                        Latest Discussions
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    {(["latest", "popular"] as const).map((s) => (
                                        <button
                                            key={s}
                                            className={`ch-sort-btn ${sort === s ? "active" : ""}`}
                                            onClick={() => setSort(s)}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                {postsLoading ? (
                                    [1, 2, 3].map((i) => (
                                        <div key={i} className="skeleton" style={{ height: 80 }} />
                                    ))
                                ) : posts.length === 0 ? (
                                    <div
                                        className="text-center py-12 rounded-2xl"
                                        style={{ background: "#faf5ff", border: "1.5px dashed #e9d5ff" }}
                                    >
                                        <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                                        <div style={{ fontWeight: 700, color: "#4c1d95" }}>No discussions yet</div>
                                        <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Be the first!</div>
                                    </div>
                                ) : (
                                    posts.slice(0, 5).map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/community/discussions/${post.id}`}
                                            className="ch-post-card"
                                            style={{ display: "block" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                                <div className="ch-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                                                    {authorName(post.author).charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 13.5,
                                                            color: "#1a1a2e",
                                                            lineHeight: 1.4,
                                                            marginBottom: 4,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {post.title}
                                                    </h4>
                                                    <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "#9ca3af" }}>
                                                        {post.category && (
                                                            <span className="ch-badge">{post.category}</span>
                                                        )}
                                                        <span>
                                                            💬 {post.commentCount ?? post._count?.comments ?? 0}
                                                        </span>
                                                        {post.createdAt && <span>{timeAgo(post.createdAt)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>

                            {posts.length > 0 && (
                                <Link
                                    href="/community/discussions"
                                    className="block text-center mt-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                                    style={{
                                        background: "#faf5ff",
                                        border: "1.5px solid #e9d5ff",
                                        color: "#7c3aed",
                                        textDecoration: "none",
                                    }}
                                >
                                    View All Discussions →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ── AI Insights Banner ────────────────────────────────── */}
                    <section className="mb-24 relative overflow-hidden">
                        <div
                            className="absolute inset-0 rounded-[3rem] blur-3xl"
                            style={{ background: "linear-gradient(to right,rgba(102,5,199,0.1),transparent,rgba(102,5,199,0.1))" }}
                        />
                        <div
                            className="ch-glass p-10 md:p-16 rounded-[4rem] relative z-10 flex flex-col lg:flex-row items-center gap-12"
                        >
                            <div className="lg:w-1/2 space-y-6">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest"
                                    style={{ background: "rgba(102,5,199,0.15)", color: "#6605c7" }}
                                >
                                    🧠 AI-Powered Moderation
                                </div>
                                <h2
                                    className="text-4xl md:text-5xl font-bold leading-tight"
                                    style={{ fontFamily: "'Noto Serif', serif", color: "#111827" }}
                                >
                                    Strictly Focused on Your{" "}
                                    <span className="animated-text">Success</span>
                                </h2>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    Our advanced AI algorithms continuously monitor and curate the community feed. We ensure
                                    100% relevance to <b>Education Loans</b>, <b>Study Abroad</b>, and <b>Career Growth</b>.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {[
                                        { icon: "✅", label: "Zero Off-topic Noise" },
                                        { icon: "🔵", label: "AI-Verified Content" },
                                    ].map((f) => (
                                        <div
                                            key={f.label}
                                            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                                            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.4)" }}
                                        >
                                            <span>{f.icon}</span>
                                            <span className="text-xs font-bold">{f.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                                {[
                                    { val: "99.8%", label: "Relevance Rate", color: "#6605c7", mt: true },
                                    { val: "24/7", label: "AI Curation", color: "#d946ef", mt: false },
                                    { val: "5k+", label: "Spam Blocked", color: "#3b82f6", mt: false },
                                    { val: "100%", label: "Secure & Focused", color: "#a855f7", mt: true },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="ch-glass p-6 rounded-3xl text-center transition-transform hover:-translate-y-2"
                                        style={{ marginTop: s.mt ? 32 : 0 }}
                                    >
                                        <div className="text-3xl font-bold" style={{ fontFamily: "'Noto Serif', serif", color: s.color }}>
                                            {s.val}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── Explore Hubs ─────────────────────────────────────── */}
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2
                                className="text-4xl font-bold mb-2"
                                style={{ fontFamily: "'Noto Serif', serif", color: "#111827" }}
                            >
                                Explore Hubs
                            </h2>
                            <p className="text-gray-500">Find your tribe in specialized communities</p>
                        </div>
                        <Link
                            href="/community/discussions"
                            className="flex items-center gap-2 font-bold text-sm hover:underline"
                            style={{ color: "#6605c7" }}
                        >
                            View All Discussions →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                        {[
                            {
                                href: "/community/discussions?category=Education+Loans",
                                img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
                                icon: "💳",
                                iconBg: "#6605c7",
                                title: "Loans & Finance",
                                desc: "Interest rates, banks, and eligibility guides.",
                                linkColor: "#a78bfa",
                            },
                            {
                                href: "/community/discussions?category=Universities",
                                img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
                                icon: "🎓",
                                iconBg: "#2563eb",
                                title: "Universities",
                                desc: "Target schools, rankings, and campus life.",
                                linkColor: "#60a5fa",
                            },
                            {
                                href: "/community/discussions?category=General",
                                img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
                                icon: "💬",
                                iconBg: "#7c3aed",
                                title: "General Discussion",
                                desc: "Ask questions, share updates, and connect with everyone.",
                                linkColor: "#c084fc",
                            },
                        ].map((cat) => (
                            <Link
                                key={cat.title}
                                href={cat.href}
                                className="ch-cat-item group h-[400px] relative flex"
                                style={{ textDecoration: "none" }}
                            >
                                <img
                                    src={cat.img}
                                    className="ch-cat-img absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity"
                                    alt={cat.title}
                                    style={{ transition: "opacity 0.3s" }}
                                />
                                <div className="ch-cat-overlay" />
                                <div className="absolute bottom-0 left-0 p-10 w-full">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg text-xl"
                                        style={{ background: cat.iconBg }}
                                    >
                                        {cat.icon}
                                    </div>
                                    <h3
                                        className="text-3xl font-bold text-white mb-2"
                                        style={{ fontFamily: "'Noto Serif', serif" }}
                                    >
                                        {cat.title}
                                    </h3>
                                    <p className="text-gray-200 text-sm">{cat.desc}</p>
                                    <div
                                        className="mt-6 flex items-center gap-2 font-bold text-sm"
                                        style={{ color: cat.linkColor }}
                                    >
                                        <span>Explore Discussions</span>
                                        <span>→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* ── Quick Topics ─────────────────────────────────────── */}
                    <section
                        className="ch-glass p-10 md:p-16 rounded-[4rem] relative overflow-hidden"
                    >
                        <div
                            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full"
                            style={{ background: "rgba(102,5,199,0.05)", filter: "blur(100px)" }}
                        />
                        <div className="flex items-center gap-3 mb-12">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(102,5,199,0.1)", color: "#6605c7" }}
                            >
                                🏷️
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold" style={{ fontFamily: "'Noto Serif', serif", color: "#111827" }}>
                                    Quick Topics
                                </h2>
                                <p className="text-sm text-gray-500">Jump directly to specific discussion points</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                            {[
                                {
                                    label: "Financial",
                                    color: "#6605c7",
                                    topics: [
                                        { name: "EMI Planning", href: "/community/discussions?tag=EMI" },
                                        { name: "Bank Reviews", href: "/community/discussions?tag=Banks" },
                                        { name: "Interest Rates", href: "/community/discussions?tag=Interest" },
                                    ],
                                },
                                {
                                    label: "Academic",
                                    color: "#3b82f6",
                                    topics: [
                                        { name: "GRE Tips", href: "/community/discussions?category=GRE+%2F+GMAT" },
                                        { name: "SOP Review", href: "/community/discussions?tag=SOP" },
                                        { name: "IELTS Prep", href: "/community/discussions?category=IELTS+%2F+TOEFL" },
                                    ],
                                },
                                {
                                    label: "Logistics",
                                    color: "#f43f5e",
                                    topics: [
                                        { name: "Visa Slots", href: "/community/discussions?category=Visa+%26+Immigration" },
                                        { name: "Housing", href: "/community/discussions?tag=Housing" },
                                        { name: "Pre-departure", href: "/community/discussions?tag=Predeparture" },
                                    ],
                                },
                                {
                                    label: "Social",
                                    color: "#f59e0b",
                                    topics: [
                                        { name: "Meetups", href: "/community/discussions?tag=Meetups" },
                                        { name: "Part-time Jobs", href: "/community/discussions?category=Career+%26+Jobs" },
                                        { name: "Referral", href: "/referral" },
                                    ],
                                },
                            ].map((group) => (
                                <div key={group.label} className="space-y-4">
                                    <h4
                                        className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                        style={{ color: group.color }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full inline-block"
                                            style={{ background: group.color }}
                                        />
                                        {group.label}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {group.topics.map((t) => (
                                            <Link key={t.name} href={t.href} className="quick-topic">
                                                {t.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => {
                    setCreateOpen(false);
                    router.push("/community/discussions");
                }}
            />
        </main>
    );
}
