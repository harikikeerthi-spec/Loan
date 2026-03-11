"use client";

import React, { useState, useEffect } from "react";
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
  onSave?: (uni: UniversityData) => void;
  isSaved?: boolean;
  aiEnhanced?: boolean;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `http://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

const COUNTRY_COLORS: Record<string, { badge: string; glow: string }> = {
  'USA': { badge: 'bg-blue-50 text-blue-600 border-blue-200', glow: 'bg-blue-400' },
  'UK': { badge: 'bg-rose-50 text-rose-600 border-rose-200', glow: 'bg-rose-400' },
  'Canada': { badge: 'bg-red-50 text-red-600 border-red-200', glow: 'bg-red-400' },
  'Australia': { badge: 'bg-amber-50 text-amber-600 border-amber-200', glow: 'bg-amber-400' },
  'Germany': { badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', glow: 'bg-emerald-400' },
  'Ireland': { badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', glow: 'bg-emerald-400' },
  'Singapore': { badge: 'bg-red-50 text-red-600 border-red-200', glow: 'bg-red-400' },
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
  onSave,
  isSaved = false,
  aiEnhanced = false,
}: UniversityTemplateProps) {
  const flag = COUNTRY_FLAGS[university.country] || '🌐';
  const acceptance = university.accept || university.acceptanceRate;
  const colors = COUNTRY_COLORS[university.country] || { badge: 'bg-purple-50 text-purple-600 border-purple-200', glow: 'bg-purple-400' };
  const slug = university.slug || generateSlug(university.name);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchLogo() {
      try {
        let domainToUse = university.domains?.[0] || extractDomain(university.website);

        if (!domainToUse && university.name) {
          const res = await fetch(`/api/university-logo?name=${encodeURIComponent(university.name)}&country=${encodeURIComponent(university.country || '')}`);
          if (res.ok) {
            const data = await res.json();
            if (data.domain) domainToUse = data.domain;
          }
        }

        if (active && domainToUse) {
          setLogoUrl(`https://logo.clearbit.com/${domainToUse}`);
        }
      } catch (err) {
        console.error("Failed to load college logo", err);
      }
    }
    setLogoError(false);
    fetchLogo();
    return () => { active = false; };
  }, [university.name, university.country, university.domains, university.website]);

  if (showFullDetails) {
    // Transform props to match the expanded UniversityData in UniversityDetailView if needed
    // or just pass as any if they are compatible enough
    return <UniversityDetailView university={university as any} onClose={() => onDetails?.(university)} />;
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-[24px] transition-all duration-500 bg-white border ${isActive ? 'border-[#6605c7]' : 'border-gray-100'} ${isActive
        ? "shadow-[0_20px_60px_rgba(102,5,199,0.15)] ring-4 ring-[#6605c7]/10 scale-[1.02]"
        : "shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1"
        }`}
    >
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-gray-50 to-gray-100/50" />
      <div className={`absolute -top-10 -right-10 w-48 h-48 ${colors.glow} rounded-full blur-[60px] opacity-20 pointer-events-none`} />

      <div className="relative p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-[18px] bg-white shadow-sm border border-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt={`${university.name} logo`}
                  className="w-full h-full object-contain p-2 shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="font-bold text-[#6605c7]/60">
                  {university.name?.charAt(0) || '🏛️'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-lg">{flag}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${colors.badge}`}>
                  {university.country}
                </span>
                {university.rank && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border bg-gray-50 text-gray-500 border-gray-200">
                    QS #{university.rank}
                  </span>
                )}
              </div>
              <h3 className="text-[17px] font-black text-gray-900 leading-[1.2] line-clamp-2 tracking-tight pr-4">
                {university.name}
              </h3>
            </div>
          </div>
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSave(university); }}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isSaved ? 'bg-[#6605c7] text-white shadow-md scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100 hover:text-gray-900'}`}
              title={isSaved ? "Saved" : "Save University"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="flex flex-col p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/80">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Accept Rate</span>
            <span className="text-emerald-700 font-black text-[15px]">{acceptance ? `${acceptance}%` : '—'}</span>
          </div>
          <div className="flex flex-col p-3 rounded-2xl bg-amber-50/70 border border-amber-100/80">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/70 mb-1">Tuition Fee</span>
            <span className="text-amber-700 font-black text-[15px]">{university.tuition ? `$${Math.round(university.tuition / 1000)}k` : '—'}</span>
          </div>
          <div className="flex flex-col p-3 rounded-2xl bg-purple-50/70 border border-purple-100/80">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-600/70 mb-1">Min GPA</span>
            <span className="text-purple-700 font-black text-[15px]">{university.min_gpa ? `${university.min_gpa}` : '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onApply?.(university); }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6605c7] to-[#8b24e5] text-white font-black text-[12px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#6605c7]/20"
          >
            Apply Loan <span className="material-symbols-outlined text-[16px] icon-filled" aria-hidden="true">arrow_forward</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDetails?.(university); }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gray-50 text-gray-700 font-black text-[12px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
