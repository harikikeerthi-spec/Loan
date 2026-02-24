"use client";

import React, { useState } from "react";
import UniversityModal from "./UniversityModal";
import { useRouter } from "next/navigation";

type Uni = {
    name: string;
    loc?: string;
    country?: string;
    rank?: number;
    tuition?: number;
    accept?: number;
    description?: string;
    _score?: number;
    loan?: boolean;
    slug?: string;
    website?: string;
};

export default function UniversityCard({ uni, index }: { uni: Uni; index: number }) {
    const [open, setOpen] = useState(false);
    const [detailed, setDetailed] = useState<null | Uni>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const router = useRouter();

    const tuition = uni.country === 'Germany' ? `€${uni.tuition?.toLocaleString()}/yr` : `$${uni.tuition?.toLocaleString()}/yr`;

    return (
        <div className="univ-card" style={{ textDecoration: 'none' }}>
            <div className="univ-rank-badge">#{index + 1}</div>
            <div className="univ-card-body">
                <div className="univ-card-name">{uni.name}</div>
                <div className="univ-card-location">{uni.loc}</div>
                <div className="univ-card-tags">
                    <span className="tag tag-rank">Rank #{uni.rank}</span>
                    <span className="tag tag-tuition">{tuition}</span>
                    <span className="tag tag-accept">{uni.accept}% accept</span>
                    {uni.loan && <span className="tag tag-loan">Loan Ready</span>}
                </div>
            </div>

            <div className="match-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1, marginBottom: 2 }}>Chance</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#7c3aed' }}>{uni._score ?? 0}%</div>
                    </div>
                    <div className="match-ring" style={{ position: 'relative', width: 44, height: 44 }}>
                        <svg viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                            <circle cx="26" cy="26" r="22" fill="none" stroke="#f3f4f6" strokeWidth={5} />
                            <circle cx="26" cy="26" r="22" fill="none" stroke="#7c3aed" strokeWidth={5} strokeLinecap="round" strokeDasharray={138.23} strokeDashoffset={138.23 * (1 - ((uni._score || 0) / 100))} />
                        </svg>
                    </div>
                </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                    {uni.website && (
                        <a href={uni.website} target="_blank" rel="noreferrer" className="univ-apply-btn">
                            Visit
                        </a>
                    )}
                    <button className="univ-apply-btn" onClick={async () => {
                        if (!uni.description && (uni.slug || uni.name)) {
                            setLoadingDetail(true);
                            try {
                                const resp = await fetch('/api/ai-search', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: 'university_detail', slug: uni.slug || '', query: uni.name || '' })
                                });
                                const data = await resp.json();
                                if (data?.university) setDetailed(data.university as any);
                                else setDetailed({ ...uni, description: uni.description || 'No description available.' });
                            } catch (e) {
                                console.error('Detail fetch failed', e);
                                setDetailed({ ...uni, description: uni.description || 'No description available.' });
                            } finally {
                                setLoadingDetail(false);
                                setOpen(true);
                            }
                        } else {
                            setDetailed(uni);
                            setOpen(true);
                        }
                    }}>{loadingDetail ? 'Loading…' : 'Details'}</button>
                    <button className="univ-apply-btn" style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }} onClick={() => {
                        const target = uni.slug && uni.slug.trim() ? uni.slug : (uni.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        router.push(`/university/${target}`);
                    }}>Apply →</button>
                </div>
            </div>

            <UniversityModal open={open} onClose={() => setOpen(false)} uni={detailed || uni} />
        </div>
    );
}
