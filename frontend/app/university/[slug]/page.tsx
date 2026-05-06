import { universities } from "@/lib/universityData";
import { notFound } from "next/navigation";
import UniversityDetailView from "@/components/UniversityDetailView";
import UniversityPageClient from '@/components/UniversityPageClient';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return Object.keys(universities).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const u = universities[slug];
    if (!u) return {};
    return {
        title: `${u.name} – Rankings & Education Loan | VidhyaLoan`,
        description: `Explore ${u.shortName}'s rankings, programs, and apply for a VidhyaLoan education loan today.`,
    };
}

export default async function UniversityPage({ params }: Props) {
    const { slug } = await params;
    let u = universities[slug];

    if (!u) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        try {
            const universityName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const resp = await fetch(`${baseUrl}/api/ai-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'university_detail', slug, query: universityName }),
                cache: 'no-store'
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.university) {
                    u = {
                        ...data.university,
                        slug: data.university.slug || slug,
                    };
                }
            }
        } catch (e) {
            console.error('AI fetch failed', e);
        }
    }

    // Render a client wrapper which will use server-side data if available,
    // otherwise attempt client-side fallback (localStorage or AI API).
    return <UniversityPageClient serverUniversity={u || null} slug={slug} />;
}
