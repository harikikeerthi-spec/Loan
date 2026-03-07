"use client";

import React, { useState } from "react";
import Link from "next/link";
import UniversityDetailView from "./UniversityDetailView";

interface UniversityData {
  name: string;
  country: string;
  city?: string;
  loc?: string;
  alpha_two_code?: string;
  domains?: string[];
  web_pages?: string[];
  website?: string;
  description?: string;
  details?: any;
  rank?: number;
  accept?: number;
  acceptanceRate?: number;
  tuition?: number;
  min_gpa?: number;
  min_ielts?: number;
  min_toefl?: number;
  courses?: string[];
  slug?: string;
}

interface UniversityTemplateProps {
  university: UniversityData;
  showFullDetails?: boolean;
  isActive?: boolean;
  onApply?: (uni: UniversityData) => void;
  onDetails?: (uni: UniversityData) => void;
  aiEnhanced?: boolean;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const COUNTRY_COLORS: Record<string, { bg: string; badge: string; glow: string }> = {
  'USA': { bg: 'from-blue-600 to-indigo-700', badge: 'bg-blue-500/20 text-blue-200 border-blue-400/20', glow: 'bg-blue-500/20' },
  'UK': { bg: 'from-red-700 to-rose-800', badge: 'bg-rose-500/20 text-rose-200 border-rose-400/20', glow: 'bg-rose-500/20' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'Ireland': '🇮🇪', 'Singapore': '🇸🇬',
};

export default function UniversityTemplate({
  university,
  showFullDetails = false,
  isActive = false,
  onApply,
  onDetails,
  aiEnhanced = false,
}: UniversityTemplateProps) {
  const flag = COUNTRY_FLAGS[university.country] || '🌐';
  const acceptance = university.accept || university.acceptanceRate;
  const colors = COUNTRY_COLORS[university.country] || { bg: 'from-[#6605c7] to-purple-900', badge: 'bg-purple-500/20 text-purple-200 border-purple-400/20', glow: 'bg-purple-500/20' };
  const slug = university.slug || generateSlug(university.name);

  if (showFullDetails) {
    // Transform props to match the expanded UniversityData in UniversityDetailView if needed
    // or just pass as any if they are compatible enough
    return <UniversityDetailView university={university as any} onClose={() => onDetails?.(university)} />;
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer ${isActive
        ? "shadow-[0_25px_60px_rgba(102,5,199,0.15)] ring-2 ring-[#6605c7]/40 scale-[1.02]"
        : "shadow-md hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1.5"
        }`}
    >
      <div className={`relative bg-gradient-to-r ${colors.bg} px-6 pt-5 pb-12`}>
        <div className={`absolute -top-8 -right-8 w-28 h-28 ${colors.glow} rounded-full blur-2xl opacity-60`} />
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-black text-lg">
              {university.name?.charAt(0) || '🏛️'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base">{flag}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${colors.badge}`}>
                  {university.country}
                </span>
              </div>
              <h3 className="text-[15px] font-black text-white leading-tight line-clamp-1 tracking-tight">
                {university.name}
              </h3>
            </div>
          </div>
          {university.rank && (
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/15 shrink-0">
              <span className="text-white/50 text-[8px] font-black uppercase tracking-wider">QS</span>
              <span className="text-white text-sm font-black leading-tight">#{university.rank}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white px-6 -mt-6 relative z-10 rounded-t-2xl pt-5 pb-5">
        <div className="flex gap-2 mb-5">
          <div className="flex-1 py-2.5 px-3 bg-emerald-50 rounded-xl text-center border border-emerald-100/60">
            <div className="text-emerald-600 text-sm font-black mb-0.5">{acceptance ? `${acceptance}%` : '—'}</div>
            <div className="text-[8px] text-emerald-400 font-bold uppercase">Accept</div>
          </div>
          <div className="flex-1 py-2.5 px-3 bg-amber-50 rounded-xl text-center border border-amber-100/60">
            <div className="text-amber-600 text-sm font-black mb-0.5">{university.tuition ? `$${Math.round(university.tuition / 1000)}k` : '—'}</div>
            <div className="text-[8px] text-amber-400 font-bold uppercase">Tuition</div>
          </div>
          <div className="flex-1 py-2.5 px-3 bg-purple-50 rounded-xl text-center border border-purple-100/60">
            <div className="text-purple-600 text-sm font-black mb-0.5">{university.min_gpa ? `${university.min_gpa}` : '—'}</div>
            <div className="text-[8px] text-purple-400 font-bold uppercase">GPA</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/apply-loan?university=${encodeURIComponent(university.name)}&country=${encodeURIComponent(university.country)}`}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6605c7] to-[#8b24e5] text-white font-black text-xs flex items-center justify-center gap-1.5"
          >
            Apply Loan
          </Link>
          <button
            onClick={() => onDetails?.(university)}
            className="px-4 py-3 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs hover:text-[#6605c7] transition-all border border-gray-100"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
