"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { communityApi } from "@/lib/api";
import {
    moderateContent,
    generateTagsFromText,
    CATEGORY_SLUG_MAP
} from "@/lib/moderation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SimilarPost {
    id: string;
    title: string;
    category?: string;
    commentCount?: number;
    createdAt?: string;
}

type Step = "title" | "description" | "checking" | "duplicate" | "appreciate" | "posting" | "done" | "blocked";

const CATEGORIES = Object.keys(CATEGORY_SLUG_MAP);

const DUPLICATE_THRESHOLD = 2; // ≥ N keyword matches → "duplicate"

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreatePostModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated?: () => void;
}) {
    const [step, setStep] = useState<Step>("title");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [tags, setTags] = useState<string[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [titleError, setTitleError] = useState<string | null>(null);
    const [contentError, setContentError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [moderationReason, setModerationReason] = useState<string | null>(null);
    const [similarPosts, setSimilarPosts] = useState<SimilarPost[]>([]);
    const titleRef = useRef<HTMLInputElement>(null);
    const { isAuthenticated } = useAuth();

    // Reset on open
    useEffect(() => {
        if (open) {
            setStep("title");
            setTitle("");
            setContent("");
            setCategory(CATEGORIES[0]);
            setTags([]);
            setSuggestedTags([]);
            setTitleError(null);
            setContentError(null);
            setSubmitError(null);
            setModerationReason(null);
            setSimilarPosts([]);
            setTimeout(() => titleRef.current?.focus(), 80);
        }
    }, [open]);

    // Close on Escape
    useEffect(() => {
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [onClose]);

    // Live tag suggestions
    useEffect(() => {
        const combined = `${title} ${content}`.trim();
        if (combined.length > 5) {
            const suggestions = generateTagsFromText(combined);
            setSuggestedTags(suggestions);
        } else {
            setSuggestedTags([]);
        }
    }, [title, content]);

    if (!open) return null;

    // ── Validation helpers ────────────────────────────────────────────────────
    const urlOrHtml = /(https?:\/\/|www\.|<[^>]+>)/i;

    const validateTitle = (): boolean => {
        const t = title.trim();
        if (!t) { setTitleError("Please enter a title for your question."); return false; }
        if (t.length < 10) { setTitleError("Title is too short — at least 10 characters."); return false; }
        if (urlOrHtml.test(t)) { setTitleError("Please avoid links or HTML in the title."); return false; }
        setTitleError(null);
        return true;
    };

    const validateContent = (): boolean => {
        const c = content.trim();
        if (!c) { setContentError("Please describe your question."); return false; }
        if (c.length < 20) { setContentError("Description is too short — at least 20 characters."); return false; }
        if (urlOrHtml.test(c)) { setContentError("Please avoid links or HTML in the description."); return false; }
        setContentError(null);
        return true;
    };

    // ── Step: Title → next ────────────────────────────────────────────────────
    const handleTitleNext = () => {
        if (!validateTitle()) return;
        setStep("description");
    };

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    // ── Step: Description → check duplicates ─────────────────────────────────
    const handleDescriptionNext = async () => {
        if (!validateContent()) return;

        // LOCAL MODERATION (AI Keyword check)
        const combinedText = `${title} ${content}`;
        const mod = moderateContent(combinedText);
        if (!mod.allowed) {
            setStep("blocked");
            setModerationReason(mod.reason || "off_topic");
            return;
        }

        setStep("checking");
        try {
            const res: any = await communityApi.searchSimilarPosts(title);
            const matches: SimilarPost[] = (res?.data || []).slice(0, 5);
            setSimilarPosts(matches);
            if (matches.length >= DUPLICATE_THRESHOLD) {
                setStep("duplicate");
            } else {
                setStep("appreciate");
            }
        } catch {
            // Network error — allow posting anyway
            setStep("appreciate");
        }
    };

    // ── Step: Appreciate → post ───────────────────────────────────────────────
    const handlePost = async (force = false) => {
        setSubmitError(null);
        if (!isAuthenticated) {
            setSubmitError("Please log in to post a question.");
            setStep("appreciate");
            return;
        }

        const categorySlug = CATEGORY_SLUG_MAP[category] || "general";

        // If not forced, run duplicate-check first
        if (!force) {
            setStep('checking');
            try {
                const dup: any = await communityApi.checkDuplicate({
                    title: title.trim(),
                    content: content.trim(),
                    category: categorySlug
                });
                if (dup?.isDuplicate) {
                    setSimilarPosts(dup.similarQuestions || []);
                    setSubmitError(dup.message || 'Similar questions found');
                    setStep('duplicate');
                    return;
                }
            } catch (e) {
                console.warn('Duplicate check failed', e);
            }
        }

        // Proceed to create post
        setStep('posting');
        try {
            await communityApi.createPost({
                title: title.trim(),
                content: content.trim(),
                category: categorySlug,
                tags,
                force
            } as any);
            setStep('done');
            onCreated?.();
        } catch (err: any) {
            setSubmitError(err?.message || 'Failed to post.');
            setStep('appreciate');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <style>{`
                .cpm-card { background: white; border-radius: 24px; box-shadow: 0 32px 80px rgba(0,0,0,0.22); max-width: 580px; width: 100%; padding: 36px 36px 32px; position: relative; animation: cpmIn 0.22s cubic-bezier(0.34,1.56,0.64,1); }
                @keyframes cpmIn { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .cpm-input { width: 100%; padding: 13px 16px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 15px; color: #1a1a2e; outline: none; box-sizing: border-box; transition: border-color 0.18s, box-shadow 0.18s; }
                .cpm-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.10); }
                .cpm-input.error { border-color: #ef4444; }
                .cpm-btn-primary { padding: 13px 28px; background: linear-gradient(135deg,#7c3aed,#6605c7); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 14.5px; cursor: pointer; transition: all 0.18s; width: 100%; }
                .cpm-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124,58,237,0.35); }
                .cpm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
                .cpm-btn-ghost { padding: 12px 20px; background: none; border: 1.5px solid #e5e7eb; border-radius: 12px; color: #6b7280; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.15s; }
                .cpm-btn-ghost:hover { border-color: #a855f7; color: #7c3aed; background: #faf5ff; }
                .cpm-tag { display: inline-flex; align-items: center; gap: 4px; padding: 5px 13px; border-radius: 9999px; font-size: 11.5px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; transition: all 0.14s; }
                .cpm-tag.active { background: #ede9fe; color: #6d28d9; border-color: #c4b5fd; }
                .cpm-tag.inactive { background: #f9fafb; color: #6b7280; border-color: #e5e7eb; }
                .cpm-tag.inactive:hover { border-color: #a855f7; color: #6d28d9; }
                .progress-dot { width: 8px; height: 8px; border-radius: 50%; transition: all 0.25s; }
                .progress-dot.done { background: #7c3aed; }
                .progress-dot.active { background: #7c3aed; width: 22px; border-radius: 4px; }
                .progress-dot.pending { background: #e9d5ff; }
                .similar-card { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border: 1.5px solid #f0f0f0; border-radius: 12px; margin-bottom: 8px; transition: all 0.14s; text-decoration: none; }
                .similar-card:hover { border-color: #c4b5fd; background: #faf5ff; }
                .spinning { animation: spin 0.9s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            <div className="cpm-card">
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#6b7280" }}
                >✕</button>

                {/* Progress dots */}
                <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`progress-dot ${i < (step === "title" ? 0 : step === "description" ? 1 : step === "checking" ? 1 : 2) ? "done" : i === (step === "title" ? 0 : step === "description" ? 1 : step === "checking" ? 1 : 2) ? "active" : "pending"}`} />
                    ))}
                </div>

                {/* ─── Step 1: Title ─────────────────────────────────────── */}
                {step === "title" && (
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", marginBottom: 8 }}>Step 1 of 3</p>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>🤔 What's your question?</h2>
                        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Write a clear, concise title that summarises what you want to know.</p>

                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Question title <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                            ref={titleRef}
                            className={`cpm-input ${titleError ? "error" : ""}`}
                            placeholder="e.g. How do I compare IDFC vs Auxilo for MS in USA?"
                            value={title}
                            onChange={e => { setTitle(e.target.value); setTitleError(null); }}
                            onKeyDown={e => { if (e.key === "Enter") handleTitleNext(); }}
                            maxLength={200}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 16 }}>
                            {titleError ? <span style={{ fontSize: 12.5, color: "#ef4444" }}>{titleError}</span> : <span />}
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{title.length}/200</span>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Category</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {CATEGORIES.map(c => (
                                    <button key={c} type="button" className={`cpm-tag ${category === c ? "active" : "inactive"}`} onClick={() => setCategory(c)}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="cpm-btn-primary" onClick={handleTitleNext} disabled={!title.trim()}>
                            Continue → Add description
                        </button>
                    </div>
                )}

                {/* ─── Step 2: Description ──────────────────────────────── */}
                {step === "description" && (
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", marginBottom: 8 }}>Step 2 of 3</p>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>📝 Describe in detail</h2>
                        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, color: "#6d28d9" }}>{title}</span>
                        </p>
                        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Provide context — loan amount, university, bank options, etc.</p>

                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                        <textarea
                            className={`cpm-input ${contentError ? "error" : ""}`}
                            style={{ resize: "vertical", minHeight: 120, lineHeight: 1.65 }}
                            placeholder="Share all the relevant details here…"
                            value={content}
                            onChange={e => { setContent(e.target.value); setContentError(null); }}
                            maxLength={3000}
                            autoFocus
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 18 }}>
                            {contentError ? <span style={{ fontSize: 12.5, color: "#ef4444" }}>{contentError}</span> : <span />}
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{content.length}/3000</span>
                        </div>

                        {suggestedTags.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>AI Suggested Tags</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {suggestedTags.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`cpm-tag ${tags.includes(tag) ? "active" : "inactive"}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="cpm-btn-ghost" onClick={() => setStep("title")} style={{ flex: 1 }}>← Back</button>
                            <button className="cpm-btn-primary" onClick={handleDescriptionNext} disabled={!content.trim()} style={{ flex: 2 }}>
                                Check &amp; preview
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Step 3a: Checking ────────────────────────────────── */}
                {step === "checking" && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#ede9fe,#f5f3ff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
                            <span className="spinning" style={{ display: "block", width: 32, height: 32, border: "3px solid #e9d5ff", borderTopColor: "#7c3aed", borderRadius: "50%" }} />
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Analysing the database…</h3>
                        <p style={{ color: "#6b7280", fontSize: 14 }}>Checking if a similar question already exists in our community.</p>
                    </div>
                )}

                {/* ─── Step 3b: Duplicate found ─────────────────────────── */}
                {step === "duplicate" && (
                    <div>
                        <div style={{ textAlign: "center", marginBottom: 22 }}>
                            <div style={{ width: 56, height: 56, border: "3px solid #fde68a", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26 }}>⚠️</div>
                            <h3 style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e", marginBottom: 6 }}>This question may already exist!</h3>
                            <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 420, margin: "0 auto" }}>
                                We found similar discussions that might already answer your question. Have a look before posting to avoid duplicates.
                            </p>
                        </div>

                        <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 20 }}>
                            {similarPosts.map(post => (
                                <Link
                                    key={post.id}
                                    href={`/community/discussions/${post.id}`}
                                    className="similar-card"
                                    onClick={onClose}
                                >
                                    <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {post.title}
                                        </div>
                                        <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#9ca3af" }}>
                                            {post.category && <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>{post.category}</span>}
                                            {post.commentCount !== undefined && <span>💬 {post.commentCount} replies</span>}
                                            {post.createdAt && <span>{timeAgo(post.createdAt)}</span>}
                                        </div>
                                    </div>
                                    <span style={{ flexShrink: 0, marginLeft: "auto", color: "#7c3aed", fontSize: 16 }}>→</span>
                                </Link>
                            ))}
                        </div>

                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, textAlign: "center" }}>
                            None of these answer your question?
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="cpm-btn-ghost" onClick={() => setStep("description")} style={{ flex: 1 }}>← Edit</button>
                            <button className="cpm-btn-primary" onClick={() => handlePost(true)} style={{ flex: 2 }}>
                                Post anyway — it's different ✍️
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Step 3c: Appreciate (no duplicate / confirmed) ───── */}
                {step === "appreciate" && (
                    <div>
                        <div style={{ textAlign: "center", marginBottom: 22 }}>
                            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 28 }}>✅</div>
                            <h3 style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e", marginBottom: 6 }}>Great question — it's unique!</h3>
                            <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
                                We didn't find any exact duplicates. The community will love getting to help you out. 🎉
                            </p>
                        </div>

                        {/* Summary preview */}
                        <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 6 }}>Your question</div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 6 }}>{title}</div>
                            <div style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.55, maxHeight: 72, overflow: "hidden", textOverflow: "ellipsis" }}>{content}</div>
                            <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
                                <span style={{ background: "#ede9fe", color: "#6d28d9", fontWeight: 700, fontSize: 11.5, padding: "3px 10px", borderRadius: 9999 }}>{category}</span>
                                {tags.map(t => (
                                    <span key={t} style={{ background: "#f3f4f6", color: "#4b5563", fontWeight: 600, fontSize: 10.5, padding: "3px 8px", borderRadius: 9999 }}>#{t}</span>
                                ))}
                            </div>
                        </div>

                        {submitError && (
                            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13.5, marginBottom: 14 }}>
                                {submitError}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="cpm-btn-ghost" onClick={() => setStep("description")} style={{ flex: 1 }}>← Edit</button>
                            <button className="cpm-btn-primary" onClick={() => handlePost()} style={{ flex: 2 }}>
                                🚀 Post to Community
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Step: Blocked ────────────────────────────────────── */}
                {step === "blocked" && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>🛑</div>
                        <h3 style={{ fontWeight: 800, fontSize: 22, color: "#1a1a2e", marginBottom: 12 }}>Question not allowed</h3>
                        <p style={{ color: "#4b5563", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                            {moderationReason === "prohibited_content"
                                ? "Your post contains prohibited language or illegal content. Please review our community guidelines."
                                : "This topic is not allowed here. Vidhya Path Aid is focused exclusively on Education, Student Loans, Visas, and Study Abroad. Please keep your questions related to these topics."}
                        </p>
                        <button className="cpm-btn-primary" onClick={() => setStep("description")}>
                            Edit my question
                        </button>
                    </div>
                )}

                {/* ─── Step: Posting ────────────────────────────────────── */}
                {step === "posting" && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ margin: "0 auto 20px", width: 48, height: 48, border: "3px solid #e9d5ff", borderTopColor: "#7c3aed", borderRadius: "50%" }} className="spinning" />
                        <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Posting your question…</h3>
                        <p style={{ color: "#6b7280", fontSize: 14 }}>Hang tight while we publish it to the community.</p>
                    </div>
                )}

                {/* ─── Step: Done ───────────────────────────────────────── */}
                {step === "done" && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎊</div>
                        <h3 style={{ fontWeight: 800, fontSize: 22, color: "#1a1a2e", marginBottom: 8 }}>Your question is live!</h3>
                        <p style={{ color: "#6b7280", fontSize: 14.5, marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>
                            The community has been notified. Expect answers and insights soon!
                        </p>
                        <button className="cpm-btn-primary" onClick={onClose}>
                            Done ✓
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
