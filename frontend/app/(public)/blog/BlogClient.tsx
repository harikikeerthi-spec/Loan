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
        const matchesCategory = activeCategory === "All" || b.category === activeCategory || (b.tags && b.tags.includes(activeCategory));
        const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const normalizeSrc = (s?: string, fallback?: string) => {
        const def = fallback || `https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=60`;
        if (!s) return def;
        try {
            const str = String(s).trim();
            if (!str) return def;
            if (/^https?:\/\//i.test(str) || str.startsWith('data:')) return str;
            // ensure leading slash for public assets
            return str.startsWith('/') ? str : `/${str}`;
        } catch {
            return def;
        }
    };

    return (
        <div className="pt-28 pb-24">
            {/* Hero */}
            <div className="bg-gradient-to-r from-[#6605c7] to-purple-800 text-white py-24 px-6 mb-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                        The Knowledge Hub
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
                        Insights & <span className="italic font-normal opacity-80">Resources</span>
                    </h1>
                    <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Expert advice on education loans, study abroad tips, financial planning, and inspiring student success stories.
                    </p>
                    <div className="max-w-xl mx-auto relative group">
                        <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-purple-300 group-focus-within:text-white transition-colors">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search articles, guides, tips..."
                            className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all font-medium text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* Categories */}
                <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar mb-16 pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-8 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                                ? "bg-[#6605c7] text-white border-[#6605c7] shadow-xl shadow-[#6605c7]/20 scale-105"
                                : "bg-white text-gray-600 border-gray-100 hover:border-[#6605c7]/30"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-[2.5rem] animate-pulse h-96" />
                        ))}
                    </div>
                ) : !filtered.length ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                        <span className="material-symbols-outlined text-7xl text-gray-300 block mb-6">dynamic_feed</span>
                        <h3 className="text-2xl font-bold mb-2">No articles match your criteria</h3>
                        <p className="text-gray-500">Try adjusting your search or switching categories</p>
                        <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="mt-8 text-[#6605c7] font-bold underline decoration-2 underline-offset-4">Reset all filters</button>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Featured Post (Big Split Card) */}
                        {page === 1 && activeCategory === "All" && !search && filtered[0] && (
                            <Link href={`/blog/${filtered[0].slug}`} className="group block bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 hover:-translate-y-2 transition-transform duration-500">
                                <div className="grid md:grid-cols-2 gap-0 overflow-hidden">
                                    <div className="aspect-[4/3] md:aspect-auto relative overflow-hidden">
                                        <Image
                                            src={normalizeSrc(filtered[0].featuredImage || filtered[0].coverImage)}
                                            alt={filtered[0].title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-1000"
                                        />
                                        <div className="absolute top-8 left-8">
                                            <span className="bg-[#6605c7] text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Featured Article</span>
                                        </div>
                                    </div>
                                    <div className="p-10 md:p-16 flex flex-col justify-center">
                                        <div className="flex items-center gap-4 text-xs font-bold text-[#6605c7] uppercase tracking-widest mb-6">
                                            <span>{filtered[0].category || "Education"}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span>{new Date(filtered[0].createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 group-hover:text-[#6605c7] transition-colors leading-tight">
                                            {filtered[0].title}
                                        </h2>
                                        <p className="text-gray-500 text-lg line-clamp-3 mb-8 leading-relaxed">
                                            {filtered[0].excerpt}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-[#6605c7]">
                                                {(filtered[0].authorName || filtered[0].author || "V")[0] || "V"}
                                            </div>
                                            <div>
                                                <p className="font-bold uppercase text-[10px] tracking-widest">Writen by</p>
                                                <p className="text-gray-500 text-sm">{filtered[0].authorName || filtered[0].author || "VidhyaLoan Team"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Standard Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filtered.slice((page === 1 && activeCategory === "All" && !search) ? 1 : 0).map((blog) => (
                                <Link key={blog.id} href={`/blog/${blog.slug}`} className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                    <div className="aspect-[16/10] relative overflow-hidden">
                                        <Image
                                            src={normalizeSrc(blog.featuredImage || blog.coverImage, `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=60`)}
                                            alt={blog.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        {blog.category && (
                                            <div className="absolute top-5 left-5">
                                                <span className="bg-white/90 backdrop-blur-md text-gray-900 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">{blog.category}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8">
                                        <h2 className="text-xl font-bold line-clamp-2 mb-4 group-hover:text-[#6605c7] transition-colors leading-snug">
                                            {blog.title}
                                        </h2>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                            {blog.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">
                                                    {(blog.authorName || blog.author || "V")[0] || "V"}
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">{blog.authorName || blog.author || "VidhyaLoan Team"}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {new Date(blog.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filtered.length > 0 && (
                    <div className="flex justify-center items-center gap-4 mt-20">
                        <button
                            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page === 1}
                            className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-gray-100 disabled:opacity-30 hover:bg-gray-50:bg-white/10 transition-all shadow-md"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <span className="text-lg font-bold px-6">Page <span className="text-[#6605c7]">{page}</span></span>
                        <button
                            onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-gray-100 hover:bg-gray-50:bg-white/10 transition-all shadow-md"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Newsletter Section */}
            <div className="max-w-7xl mx-auto px-6 mt-32">
                <div className="bg-[#6605c7] rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-[0_40px_80px_rgba(102,5,199,0.3)]">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <span className="material-symbols-outlined text-6xl text-purple-200 mb-8 block">mail</span>
                        <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">
                            Stay Ahead in Your <span className="italic">Study Abroad</span> Journey
                        </h2>
                        <p className="text-purple-100 text-lg mb-12 opacity-80 leading-relaxed">
                            Join 50,000+ students. Get the latest loan insights, university guides, and exclusive tips delivered to your inbox.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-4 p-2 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="flex-1 bg-transparent border-none px-8 py-4 text-white placeholder-purple-200 focus:ring-0 outline-none font-medium"
                                required
                            />
                            <button className="bg-white text-[#6605c7] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.05] transition-all shadow-xl">
                                Subscribe Now
                            </button>
                        </form>
                        <p className="text-[10px] text-purple-300 mt-6 uppercase tracking-widest font-bold opacity-60">Zero Spam. Unsubscribe at any time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
