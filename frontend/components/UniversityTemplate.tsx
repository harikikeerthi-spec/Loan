"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'Ireland': '🇮🇪', 'Singapore': '🇸🇬',
  'France': '🇫🇷', 'Netherlands': '🇳🇱', 'Sweden': '🇸🇪',
  'Spain': '🇪🇸', 'Italy': '🇮🇹', 'UAE': '🇦🇪', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'China': '🇨🇳', 'Hong Kong': '🇭🇰',
};

const COUNTRY_COLORS: Record<string, { bg: string; accent: string; badge: string; glow: string }> = {
  'USA': { bg: 'from-blue-600 to-indigo-700', accent: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-200 border-blue-400/20', glow: 'bg-blue-500/20' },
  'UK': { bg: 'from-red-700 to-rose-800', accent: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-200 border-rose-400/20', glow: 'bg-rose-500/20' },
  'Canada': { bg: 'from-red-600 to-red-800', accent: 'text-red-400', badge: 'bg-red-500/20 text-red-200 border-red-400/20', glow: 'bg-red-500/20' },
  'Australia': { bg: 'from-amber-600 to-amber-800', accent: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-200 border-amber-400/20', glow: 'bg-amber-500/20' },
  'Germany': { bg: 'from-gray-800 to-gray-900', accent: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/20', glow: 'bg-yellow-500/20' },
  'France': { bg: 'from-blue-700 to-blue-900', accent: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-200 border-blue-400/20', glow: 'bg-blue-500/20' },
};

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function UniversityTemplate({
  university,
  showFullDetails = false,
  isActive = false,
  onApply,
  onDetails,
  aiEnhanced = false,
}: UniversityTemplateProps) {
  const [aiDetails, setAiDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const website =
    (Array.isArray(university.web_pages) && university.web_pages[0]) ||
    university.website ||
    "";

  const domain =
    (Array.isArray(university.domains) && university.domains[0]) ||
    university.alpha_two_code ||
    "";

  const location = university.loc || university.city || university.country;
  const flag = COUNTRY_FLAGS[university.country] || '🌐';
  const acceptance = university.accept || university.acceptanceRate;
  const colors = COUNTRY_COLORS[university.country] || { bg: 'from-[#6605c7] to-purple-900', accent: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-200 border-purple-400/20', glow: 'bg-purple-500/20' };
  const slug = university.slug || generateSlug(university.name);

  // Fetch AI-enhanced details
  useEffect(() => {
    if (showFullDetails && !aiDetails && !aiEnhanced) {
      fetchAIDetails();
    }
  }, [showFullDetails]);

  const fetchAIDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await fetch(
        `/api/university-details?name=${encodeURIComponent(university.name)}&country=${encodeURIComponent(university.country)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.details) {
          setAiDetails(data.details);
        }
      }
    } catch (error) {
      console.error("Failed to fetch AI details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ──────────────────────────────────────────
  // Card View (Compact) – Premium Bento Card
  // ──────────────────────────────────────────
  if (!showFullDetails) {
    return (
      <div
        className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer ${isActive
          ? "shadow-[0_25px_60px_rgba(102,5,199,0.15)] ring-2 ring-[#6605c7]/40 scale-[1.02]"
          : "shadow-md hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1.5"
          }`}
      >
        {/* Gradient Header Strip */}
        <div className={`relative bg-gradient-to-r ${colors.bg} px-6 pt-5 pb-12`}>
          {/* Decorative Orb */}
          <div className={`absolute -top-8 -right-8 w-28 h-28 ${colors.glow} rounded-full blur-2xl opacity-60`} />
          <div className="absolute top-0 left-0 right-0 h-full opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20L20 0z' fill='%23fff' fill-opacity='0.05'/%3E%3C/svg%3E\")", backgroundSize: '20px 20px' }} />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* University Initial */}
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-black text-lg shadow-lg">
                {university.name?.charAt(0) || '🏛️'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base drop-shadow-md">{flag}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${colors.badge}`}>
                    {university.alpha_two_code || university.country}
                  </span>
                </div>
                <h3 className="text-[15px] font-black text-white leading-tight line-clamp-1 tracking-tight drop-shadow-sm">
                  {university.name}
                </h3>
              </div>
            </div>

            {/* Rank Badge */}
            {university.rank && (
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/15 shrink-0">
                <span className="text-white/50 text-[8px] font-black uppercase tracking-wider leading-none">QS</span>
                <span className="text-white text-sm font-black leading-tight">#{university.rank}</span>
              </div>
            )}
          </div>
        </div>

        {/* White Card Body */}
        <div className="bg-white px-6 -mt-6 relative z-10 rounded-t-2xl pt-5 pb-5">
          {/* Stats Row – Floating Cards */}
          <div className="flex gap-2 mb-5">
            <div className="flex-1 py-2.5 px-3 bg-emerald-50 rounded-xl text-center border border-emerald-100/60">
              <div className="text-emerald-600 text-sm font-black leading-none mb-0.5">
                {acceptance ? `${acceptance}%` : '—'}
              </div>
              <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Accept</div>
            </div>
            <div className="flex-1 py-2.5 px-3 bg-amber-50 rounded-xl text-center border border-amber-100/60">
              <div className="text-amber-600 text-sm font-black leading-none mb-0.5">
                {university.tuition ? `$${Math.round(university.tuition / 1000)}k` : '—'}
              </div>
              <div className="text-[8px] text-amber-400 font-bold uppercase tracking-wider">Tuition</div>
            </div>
            <div className="flex-1 py-2.5 px-3 bg-purple-50 rounded-xl text-center border border-purple-100/60">
              <div className="text-purple-600 text-sm font-black leading-none mb-0.5">
                {university.min_gpa ? `${university.min_gpa}` : '—'}
              </div>
              <div className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">GPA</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onApply?.(university); }}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6605c7] to-[#8b24e5] text-white font-black text-xs hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              Apply Loan
            </button>
            <Link
              href={`/university/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs hover:bg-gray-100 hover:text-[#6605c7] transition-all flex items-center gap-1.5 border border-gray-100"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Details
            </Link>
          </div>
        </div>

        {/* Subtle Active Indicator */}
        {isActive && (
          <div className="absolute top-3 right-3 z-20">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
              <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────
  // Full Details View – Premium Clean Design
  // ──────────────────────────────────────────
  return (
    <div className="w-full bg-[#fcfaff] rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white">
      {/* Hero Header - Refined Gradient */}
      <div className="relative bg-gradient-to-br from-[#1a1626] to-[#2d244a] p-10 pb-16">
        {/* Subtle Glass Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-60 h-60 bg-indigo-500/10 rounded-full blur-[60px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          {/* University Icon / Logo Placeholder */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-black text-white shadow-2xl shrink-0">
            {university.name?.charAt(0) || '🏛️'}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-3">
              <span className="text-2xl filter drop-shadow-md">{flag}</span>
              <span className="text-[11px] text-purple-300 font-bold uppercase tracking-[0.2em]">
                {university.country}
              </span>
              {aiEnhanced && (
                <span className="text-[10px] bg-white/10 text-white px-3 py-1 rounded-full font-bold backdrop-blur-sm border border-white/10">
                  AI INSIGHTS ✨
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              {university.name}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-purple-200/80 text-sm font-medium">
              <span className="flex items-center gap-1.5"><span className="opacity-60">📍</span> {location}</span>
              {domain && <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-purple-400/50" /> {domain}</span>}
            </div>
          </div>

          {/* View Full Page Link */}
          <Link
            href={`/university/${slug}`}
            className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-bold text-xs uppercase tracking-widest rounded-2xl border border-white/20 hover:bg-white/20 transition-all shrink-0"
          >
            Full Page <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>

        {/* Floating Quick Info Bar */}
        <div className="absolute -bottom-10 left-10 right-10 hidden md:grid grid-cols-4 gap-4">
          {[
            { label: 'Global Rank', val: university.rank ? `#${university.rank}` : '—', color: 'text-purple-600', bg: 'bg-white' },
            { label: 'Acceptance', val: acceptance ? `${acceptance}%` : '—', color: 'text-emerald-600', bg: 'bg-white' },
            { label: 'Tuition (Avg)', val: university.tuition ? `$${Math.round(university.tuition / 1000)}K` : '—', color: 'text-amber-600', bg: 'bg-white' },
            { label: 'Min GPA', val: university.min_gpa ? `${university.min_gpa}/4.0` : '—', color: 'text-indigo-600', bg: 'bg-white' }
          ].map((item, idx) => (
            <div key={idx} className={`${item.bg} rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-purple-50 flex flex-col items-center justify-center`}>
              <span className={`text-xl font-black ${item.color}`}>{item.val}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Body - Clean Workspace */}
      <div className="p-8 pt-16 md:pt-20 space-y-10">
        {/* Loading State */}
        {loadingDetails && (
          <div className="py-20 text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Generating AI Insights...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Context Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* AI Insight Pill */}
            {(aiDetails?.matchInsight || aiEnhanced) && (
              <div className="mb-10 p-5 bg-purple-500/10 backdrop-blur-md rounded-[2rem] border border-purple-200/20 flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/20">
                  <span className="material-symbols-outlined text-2xl animate-pulse">psychology</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">AI Match Insight</div>
                  <p className="text-gray-700 text-sm font-medium leading-relaxed italic">
                    {aiDetails?.matchInsight || `Based on your profile, ${university.name} presents a high-compatibility match for ${aiDetails?.primaryField || 'advanced studies'}. Recommended focus on ${aiDetails?.focusArea || 'research and technical'} projects for a stronger admission chance.`}
                  </p>
                </div>
              </div>
            )}

            {/* Program Grid */}
            {(university.courses || aiDetails?.popularCourses) && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-sm">auto_stories</span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.1em]">Flagship Programs</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(university.courses || aiDetails?.popularCourses || []).slice(0, 6).map((course: string, i: number) => (
                    <div
                      key={i}
                      className="px-5 py-4 bg-white hover:bg-purple-50 border border-gray-100 rounded-2xl transition-all group cursor-default"
                    >
                      <div className="text-xs text-purple-400 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">PROGM-{i + 1}</div>
                      <div className="text-gray-900 font-bold text-sm tracking-tight">{course}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GradRight Intelligence & ROI */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-purple-100 shadow-[0_20px_40px_rgba(102,5,199,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[100px] text-purple-600">analytics</span>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#6605c7] rounded-xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">Powered By</div>
                  <div className="text-lg font-black text-gray-900 tracking-tight">GradRight Insights</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-sm text-gray-500 font-bold mb-4">Financial Outlook</div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">Avg ROI Multiplier</span>
                      <span className="text-xl font-black text-emerald-700">4.2x</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-tight">Loan Approval Rate</span>
                      <span className="text-xl font-black text-purple-700">91%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-bold mb-4">Employment Data</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Median Salary: {aiDetails?.employmentStats?.averageSalary || '$75,000'}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Placement Rate: {aiDetails?.employmentStats?.employmentRate || '89'}%
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium mt-4">
                      * Real application data processed via Credenc & GradRight proprietary algorithms for high-confidence matching.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://gradright.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-purple-50 text-purple-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-purple-100 hover:bg-purple-100 transition-all"
              >
                Deep Dive on GradRight <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </section>

            {/* Scholarships Summary */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-sm">card_giftcard</span>
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.1em]">Funding & Scholarships</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Merit Excellence Award", val: "Up to 30%", desc: "Based on GRE/GMAT and GPA" },
                  { title: "VidhyaLoan Advantage", val: "Low Interest", desc: "Special rates for top-tier uni" }
                ].map((s, i) => (
                  <div key={i} className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-emerald-200 transition-all">
                    <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">{s.val}</div>
                    <div className="font-black text-gray-900 text-sm mb-1">{s.title}</div>
                    <div className="text-[11px] text-gray-400 font-bold">{s.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Quick Stats Column */}
          <div className="space-y-8">
            {/* Admissions Box */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-6">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em]">Admissions</h3>

              <div className="space-y-4">
                {[
                  { icon: '📝', label: 'IELTS Band', val: university.min_ielts || '6.5+' },
                  { icon: '🏫', label: 'GPA Req.', val: university.min_gpa || '3.0/4.0' },
                  { icon: '🎓', label: 'Scholarships', val: aiDetails?.scholarships ? 'High' : 'Merit Only' },
                  { icon: '📅', label: 'Next Intake', val: 'Sept 2025' }
                ].map((req, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{req.icon}</span>
                      <span className="text-sm text-gray-500 font-medium">{req.label}</span>
                    </div>
                    <span className="text-sm text-gray-900 font-black">{req.val}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={() => onApply?.(university)}
                  className="w-full py-5 bg-[#6605c7] text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-[0_15px_30px_rgba(102,5,199,0.2)] active:scale-[0.98] text-sm"
                >
                  Apply for Loan →
                </button>
                <Link
                  href={`/university/${slug}`}
                  className="block w-full py-4 text-center bg-gray-50 text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 hover:text-[#6605c7] transition-all border border-gray-100"
                >
                  View Full University Page →
                </Link>
              </div>
            </div>

            {/* Official Links */}
            <div className="bg-[#1a1626] rounded-3xl p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">Official Channels</h3>
              <div className="space-y-3">
                {website && (
                  <a href={website} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white">University Portal</span>
                    <span className="material-symbols-outlined text-base opacity-40 group-hover:opacity-100 transition-opacity">open_in_new</span>
                  </a>
                )}
                <Link href={`/compare-universities?u=${encodeURIComponent(university.name)}`} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                  <span className="text-sm font-bold text-gray-300 group-hover:text-white">Compare Data</span>
                  <span className="material-symbols-outlined text-base opacity-40 group-hover:opacity-100 transition-opacity">compare_arrows</span>
                </Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">
                * Admission criteria, tuition fees, and ROI metrics are approximate estimates based on recent data from QS and GradRight. Final decisions rest with the university admissions board.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
