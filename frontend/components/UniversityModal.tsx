"use client";

import React from "react";

type Uni = {
    name: string;
    loc?: string;
    country?: string;
    rank?: number;
    tuition?: number;
    accept?: number;
    description?: string;
    website?: string;
    slug?: string;
};

export default function UniversityModal({ open, onClose, uni }: { open: boolean; onClose: () => void; uni: Uni | null }) {
    if (!open || !uni) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[min(760px,96%)] z-70">
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold">{uni.name}</h3>
                        <div className="text-sm text-gray-500 mt-1">{uni.loc} • {uni.country}</div>
                        <div className="mt-3 text-sm text-gray-700">{uni.description || 'No description available.'}</div>

                        <div className="mt-4 flex gap-3">
                            {uni.website && (
                                <a href={uni.website} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary/90 text-white rounded-lg text-sm font-semibold">
                                    Visit University Website
                                </a>
                            )}
                            {uni.slug && (
                                <a href={`/university/${uni.slug}`} className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700">
                                    More Details
                                </a>
                            )}
                            <button onClick={onClose} className="ml-auto text-sm text-gray-500">Close</button>
                        </div>
                    </div>
                    <div className="w-32 text-right">
                        <div className="text-xs text-gray-500">Rank</div>
                        <div className="text-2xl font-bold mt-1">#{uni.rank ?? '-'}</div>
                        <div className="text-xs text-gray-500 mt-4">Tuition</div>
                        <div className="text-sm font-semibold mt-1">{uni.tuition ? (uni.country === 'Germany' ? `€${uni.tuition.toLocaleString()}/yr` : `$${uni.tuition.toLocaleString()}/yr`) : '-'}</div>
                        <div className="text-xs text-gray-500 mt-3">Acceptance</div>
                        <div className="text-sm font-semibold mt-1">{uni.accept ?? '-'}%</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
