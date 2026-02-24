"use client";

import React, { useEffect, useState } from "react";
import { communityApi } from "@/lib/api";

type Post = {
    id: string;
    title: string;
    content: string;
    author?: { name?: string; email?: string } | string;
    createdAt?: string;
    slug?: string;
};

export default function CommunityFeed({ topic }: { topic?: string }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        communityApi
            .getPosts(topic, 1)
            .then((res: any) => {
                // Backend returns { success: true, data: posts, pagination: {} }
                const list = Array.isArray(res)
                    ? res
                    : res.data || res.posts || res.items || [];
                setPosts(list);
            })
            .catch((err) => {
                console.error("Failed to fetch posts", err);
                setPosts([]);
            })
            .finally(() => setLoading(false));
    }, [topic]);

    if (loading) {
        return <div className="space-y-4">Loading posts...</div>;
    }

    if (!posts.length) {
        return <div className="p-6 rounded-2xl glass-panel text-sm">No discussions yet. Be the first to post!</div>;
    }

    return (
        <div className="space-y-4">
            {posts.map((p) => (
                <article key={p.id || p.slug || Math.random()} className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{(typeof p.author === 'string' ? p.author : p.author?.name || p.author?.email || 'U').charAt(0).toUpperCase()}</div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{p.title}</h3>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{p.content}</p>
                            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                <span>{p.author && (typeof p.author === 'string' ? p.author : p.author?.name || p.author?.email)}</span>
                                <span>•</span>
                                <span>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <a href={`/explore/post/${p.slug || p.id}`} className="text-sm font-bold text-primary">View</a>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
