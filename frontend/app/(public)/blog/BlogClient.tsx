"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { blogApi } from "@/lib/api";
import type { BlogPost } from "@/types";

const categories = ["All", "Tips & Guides", "Success Stories", "News & Updates", "USA", "UK", "Canada", "Australia"];

export default function BlogClient() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const loadBlogs = async () => {
            setLoading(true);
            try {
                const data = await blogApi.getAll(page, 12) as { blogs?: BlogPost[]; data?: BlogPost[] };
                setBlogs(data?.blogs || data?.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadBlogs();
    }, [page]);

    const filtered = blogs.filter((b) => {
        const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    return (
        <div className="pt-28 pb-24">
            {/* Hero */}
            <div className="bg-gradient-to-r from-[#6605c7] to-purple-700 text-white py-20 px-6 mb-16">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest mb-4">
                        Knowledge Hub
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold font-display mb-6">
                        Education Loan Blog
                    </h1>
                    <p className="text-xl text-purple-100 mb-8">
                        Expert guides, success stories, and tips to navigate your study abroad journey.
                    </p>
                    <div className="max-w-xl mx-auto relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar mb-12 pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20"
                                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Blog Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden animate-pulse h-96" />
                        ))}
                    </div>
                ) : !filtered.length ? (
                    <div className="text-center py-24">
                        <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">article</span>
                        <h3 className="text-2xl font-bold dark:text-white mb-2">No articles found</h3>
                        <p className="text-gray-500">Try a different search or category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.slice(0, 1).map((blog) => (
                            <Link key={blog.id} href={`/blog/${blog.slug}`} className="md:col-span-2 lg:col-span-1 group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                                <div className="aspect-video relative">
                                    <Image
                                        src={blog.coverImage || `https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=60`}
                                        alt={blog.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <div className="inline-block px-3 py-1 bg-[#6605c7] text-white text-xs font-bold rounded-full mb-3">Featured</div>
                                    <h2 className="text-xl font-bold text-white line-clamp-2">{blog.title}</h2>
                                    <p className="text-gray-300 text-sm mt-2 line-clamp-2">{blog.excerpt}</p>
                                    <div className="mt-4 flex items-center gap-2 text-gray-400 text-xs">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        {new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {filtered.slice(1).map((blog) => (
                            <Link key={blog.id} href={`/blog/${blog.slug}`} className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                                {blog.coverImage && (
                                    <div className="aspect-video relative overflow-hidden">
                                        <Image
                                            src={blog.coverImage}
                                            alt={blog.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    {blog.tags && blog.tags[0] && (
                                        <div className="inline-block px-3 py-1 bg-[#6605c7]/10 text-[#6605c7] text-xs font-bold rounded-full mb-3">
                                            {blog.tags[0]}
                                        </div>
                                    )}
                                    <h2 className="text-lg font-bold dark:text-white line-clamp-2 mb-3 group-hover:text-[#6605c7] transition-colors">
                                        {blog.title}
                                    </h2>
                                    {blog.excerpt && (
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{blog.excerpt}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-gray-400 text-xs">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                            {blog.author || "VidhyaLoan Team"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                            {new Date(blog.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && blogs.length > 0 && (
                    <div className="flex justify-center gap-4 mt-16">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-6 py-3 bg-white dark:bg-slate-800 rounded-xl font-bold border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 transition-all"
                        >
                            ← Previous
                        </button>
                        <span className="px-6 py-3 bg-[#6605c7] text-white rounded-xl font-bold">{page}</span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="px-6 py-3 bg-white dark:bg-slate-800 rounded-xl font-bold border border-gray-200 dark:border-slate-700 hover:bg-gray-50 transition-all"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
