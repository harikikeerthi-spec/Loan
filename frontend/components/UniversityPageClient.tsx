"use client";

import React, { useEffect, useState } from "react";
import UniversityDetailView from "@/components/UniversityDetailView";

interface Props {
  serverUniversity?: any | null;
  slug: string;
}

export default function UniversityPageClient({ serverUniversity, slug }: Props) {
  const [uni, setUni] = useState<any | null>(serverUniversity || null);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (uni) return;
    // Try localStorage first (set when user clicked Details)
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('selectedUniversity') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        // If slug matches or name matches, use it
        const parsedSlug = parsed.slug || (parsed.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Skip stale cached data with placeholder URLs
        const isStale = !parsed.website || parsed.website === 'https://example.edu' || (!parsed.logo && !parsed.logoUrl);
        if (!isStale && (!slug || parsedSlug === slug)) {
          setUni(parsed);
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    // Fallback: fetch server API for details
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/ai-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'university_detail', slug, query: slug })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.university) setUni({ ...data.university, slug });
        }
      } catch (err) {
        console.error('client fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug, uni]);

  // If we have a uni but it's missing images/logo, try to enrich via AI API
  useEffect(() => {
    if (!uni) return;
    const needsHero = !uni.heroImage && !uni.image;
    const needsLogo = !uni.logo && !uni.logoUrl;
    const needsGallery = !(uni.campusImages && uni.campusImages.length > 0) && !(uni.images && uni.images.length > 0);
    if (!needsHero && !needsLogo && !needsGallery) return;

    let cancelled = false;
    const enrich = async () => {
      setEnriching(true);
      try {
        const resp = await fetch('/api/ai-search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'university_detail', query: uni.name, country: uni.country })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.university) {
            const merged = { ...uni, ...data.university };
            if (!cancelled) {
              setUni(merged);
              try { window.localStorage.setItem('selectedUniversity', JSON.stringify(merged)); } catch (e) { /* ignore */ }
            }
          }
        }
      } catch (err) {
        console.error('enrich failed', err);
      } finally {
        if (!cancelled) setEnriching(false);
      }
    };

    enrich();
    return () => { cancelled = true; };
  }, [uni]);

  if (!uni && loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf8ff] p-10">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6" />
      <h2 className="text-2xl font-black text-gray-900 mb-2">Finding University Profile...</h2>
      <p className="text-gray-500 font-medium">Gathering official data and rankings</p>
    </div>
  );

  if (!uni) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf8ff] p-10">
      <span className="material-symbols-outlined text-gray-300 text-6xl mb-6">domain_disabled</span>
      <h2 className="text-2xl font-black text-gray-900 mb-2">University Not Found</h2>
      <p className="text-gray-500 font-medium mb-8">We couldn't locate this specific institution.</p>
      <button onClick={() => window.history.back()} className="px-8 py-3 bg-purple-600 text-white font-black rounded-2xl shadow-xl">Go Back</button>
    </div>
  );

  // Normalize the university object to avoid runtime errors in the detail view
  const normalized = {
    slug: uni.slug || slug || '',
    name: uni.name || uni.title || 'Unknown University',
    shortName: uni.shortName || (uni.name ? uni.name.split(' ')[0] : 'University'),
    location: uni.loc || uni.location || uni.city || '',
    country: uni.country || uni.countryCode || '',
    countryCode: uni.countryCode || (uni.country ? (uni.country || '').slice(0, 2).toLowerCase() : ''),
    flag: uni.flag || undefined,
    founded: uni.founded || 1900,
    type: uni.type || 'University',
    rank: uni.rank || uni.qsRank || 999,
    rankBy: uni.rankBy || 'QS',
    acceptanceRate: uni.acceptanceRate || uni.accept || uni.acceptance || 0,
    tuition: uni.tuition || 0,
    currency: uni.currency || 'USD',
    description: uni.description || uni.summary || '',
    heroImage: uni.heroImage || uni.image || '',
    campusImages: uni.campusImages || uni.images || [],
    logo: (() => {
      const raw = uni.logo || uni.logoUrl || '';
      if (raw && !raw.includes('placeholder') && !raw.includes('example')) return raw;
      // Auto-generate from website domain using Clearbit
      const web = uni.website || '';
      if (web) {
        try {
          const domain = new URL(web).hostname.replace(/^www\./, '');
          return `https://logo.clearbit.com/${domain}`;
        } catch { /* ignore */ }
      }
      return raw;
    })(),
    primaryColor: uni.primaryColor || '#6605c7',
    gradient: uni.gradient || '',
    badge: uni.badge || 'AI Verified',
    website: uni.website || uni.web_pages || (uni.website && uni.website[0]) || '',
    stats: (uni.stats && typeof uni.stats === 'object') ? {
      totalStudents: uni.stats.totalStudents || '—',
      internationalStudents: uni.stats.internationalStudents || '—',
      facultyRatio: uni.stats.facultyRatio || '—',
      researchOutput: uni.stats.researchOutput || '—',
      employmentRate: uni.stats.employmentRate || '—',
      avgSalary: uni.stats.avgSalary || '—'
    } : { totalStudents: '—', internationalStudents: '—', facultyRatio: '—', researchOutput: '—', employmentRate: '—', avgSalary: '—' },
    programs: (Array.isArray(uni.programs) ? uni.programs : (Array.isArray(uni.courses) ? uni.courses : [])).map((p: any) => {
      if (typeof p === 'string') return { name: p, degree: 'Master\'s', duration: '2 Years', tuition: 'See Website', icon: 'school' };
      return {
        name: p.name || p.title || 'Unknown program',
        degree: p.degree || p.level || 'Master\'s',
        duration: p.duration || '2 Years',
        tuition: p.tuition || p.fees || 'Contact University',
        icon: p.icon || 'auto_stories'
      };
    }),
    topRecruiters: typeof uni.topRecruiters === 'string' ? uni.topRecruiters.split(',').map((s: string) => s.trim()) : (uni.topRecruiters || []),
    requirements: (uni.requirements && typeof uni.requirements === 'object') ? {
      gpa: uni.requirements.gpa || '—',
      ielts: uni.requirements.ielts || '—',
      toefl: uni.requirements.toefl || '—',
      gre: uni.requirements.gre || '—'
    } : { gpa: '—', ielts: '—', toefl: '—', gre: '—' },
    loanInfo: typeof uni.loanInfo === 'object' && uni.loanInfo !== null ? uni.loanInfo : { availableLenders: [], avgLoanAmount: '', collateralFree: false, fastTrack: false, notes: '' },
    pros: Array.isArray(uni.pros) ? uni.pros : (typeof uni.pros === 'string' ? uni.pros.split('\n').filter(Boolean) : []),
    campusFacilities: Array.isArray(uni.campusFacilities) ? uni.campusFacilities : [],
    funFacts: Array.isArray(uni.funFacts) ? uni.funFacts : [],
    whyStudyHere: Array.isArray(uni.whyStudyHere) ? uni.whyStudyHere : [],
    notableAlumni: Array.isArray(uni.notableAlumni) ? uni.notableAlumni : [],
  } as any;

  return <UniversityDetailView university={normalized} />;
}
