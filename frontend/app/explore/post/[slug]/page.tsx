import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/community/posts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return notFound();
    }

    const json = await res.json();
    const post = json?.data || json?.post || json;

    if (!post) return notFound();

    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-6">
          <span>{
            typeof post.author === 'string'
              ? post.author
              : post.author?.name
              ? post.author.name
              : post.author?.firstName || post.author?.lastName
              ? `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim()
              : 'Unknown'
          }</span>
          <span className="mx-2">•</span>
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}</span>
        </div>

        <div className="prose max-w-full">
          <p>{post.content}</p>
        </div>

        <div className="mt-8">
          <a className="text-primary font-semibold" href="/explore">
            ← Back to discussions
          </a>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Failed to load post", err);
    return notFound();
  }
}
