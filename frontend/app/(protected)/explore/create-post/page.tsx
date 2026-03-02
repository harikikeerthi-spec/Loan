"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { communityApi, aiApi } from "@/lib/api";

const TOPICS = ["loan", "visa", "university", "career", "general"];

export default function CreatePostPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [topic, setTopic] = useState("general");
    const [tags, setTags] = useState<string[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(false);

    const tagTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // AI Tag Suggestions based on TITLE only
    useEffect(() => {
        if (!title.trim() || title.length < 5) {
            setSuggestedTags([]);
            return;
        }

        if (tagTimeoutRef.current) clearTimeout(tagTimeoutRef.current);

        tagTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await aiApi.suggestTags(title) as { success: boolean; tags: string[] };
                if (res.success && res.tags) {
                    setSuggestedTags(res.tags);
                }
            } catch (e) {
                console.warn("Failed to get AI tags", e);
            }
        }, 800);

        return () => {
            if (tagTimeoutRef.current) clearTimeout(tagTimeoutRef.current);
        };
    }, [title]);

    const toggleTag = (tag: string) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) { setError("Title and content are required"); return; }

        // AI relevance check
        setChecking(true);
        try {
            // Enhanced relevance check with topic context
            const rel = await communityApi.checkRelevance(title, content) as { relevant?: boolean; reason?: string };
            if (rel && (rel.relevant === false || (rel as any).isRelevant === false)) {
                setError(`Post not relevant to education/loans: ${rel.reason || "Please keep topics related to education and loans."}`);
                setChecking(false);
                return;
            }
        } catch {
            // Ignore relevance check errors
        }
        setChecking(false);

        setLoading(true);
        setError("");
        try {
            // Include tags and use canonical 'category' field if needed or 'topic'
            const result = await communityApi.createPost({
                title,
                content,
                category: topic,
                tags: tags.length > 0 ? tags : suggestedTags.slice(0, 3)
            } as any) as { post?: { slug?: string; id?: string } };

            const slug = result?.post?.slug || result?.post?.id;
            router.push(slug ? `/explore/${slug}` : "/explore");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold font-display mb-2">Ask a Question</h1>
                        <p className="text-gray-500">Share your query with the VidhyaLoan community</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                        {/* Topic */}
                        <div>
                            <label className="text-sm font-bold block mb-3">Topic</label>
                            <div className="flex flex-wrap gap-2">
                                {TOPICS.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTopic(t)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${topic === t
                                            ? "bg-[#6605c7] text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-sm font-bold block mb-2">Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. What documents are needed for HDFC Credila education loan?"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6605c7] transition-all"
                                maxLength={200}
                                required
                            />
                            <div className="text-right text-xs text-gray-400 mt-1">{title.length}/200</div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="text-sm font-bold block mb-2">Details <span className="text-red-500">*</span></label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Provide more context about your question. What have you already tried? What specifically are you confused about?"
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6605c7] transition-all resize-none"
                                required
                            />
                            <div className="text-right text-xs text-gray-400 mt-1">{content.length} characters</div>
                        </div>

                        {/* Suggested Tags (AI based on Title) */}
                        {suggestedTags.length > 0 && (
                            <div>
                                <label className="text-sm font-bold block mb-3">Suggested Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedTags.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => toggleTag(t)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${tags.includes(t)
                                                ? "bg-[#6605c7] text-white border-[#6605c7]"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-[#6605c7] hover:text-[#6605c7]"
                                                }`}
                                        >
                                            #{t}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 italic">Tags suggested by AI based on your title</p>
                            </div>
                        )}

                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || checking}
                                className="flex-1 py-3 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#7a0de8] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                            >
                                {(loading || checking) && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
                                {checking ? "Analyzing..." : loading ? "Posting..." : "Post Question"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

