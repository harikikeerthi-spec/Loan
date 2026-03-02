"use client";

import React, { useState } from 'react';
import UniversityCard from '../../../components/UniversityCard';
import UniversityDetailsModal from '../../../components/UniversityDetailsModal';
import { useUniversity } from '@/context/UniversityContext';

const POPULAR = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'India', 'Singapore', 'Sweden', 'Switzerland', 'Japan', 'South Korea', 'China', 'New Zealand'
];

export default function SearchUniversitiesPage() {
  const [selected, setSelected] = useState<string[]>(['United States']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<any | null>(null);
  const { selectedUniversity } = useUniversity();

  function toggleCountry(c: string) {
    setSelected((s) => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
  }

  async function search() {
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/university-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countries: selected, limit: 50 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results || []);
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaff]">
      {/* Hero Section - Clean & Modern Glassmorphism */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-200/20 rounded-full blur-[80px]" />

        <div className="max-w-[1400px] mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-100 shadow-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Global Academic Database</span>
            <span className="w-px h-3 bg-purple-100 mx-1" />
            <span className="text-[10px] font-bold text-gray-400">Powered by GradRight</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-8 text-gray-900 tracking-tight leading-[1.1]">
            Find Your Future <br /><span className="text-[#6605c7] relative">
              Universe
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="#6605c7" strokeWidth="2" fill="none" opacity="0.3" />
              </svg>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
            Explore 10,000+ verified institutions across the globe. Match your profile with ROI-backed insights and secure your study loan in clicks.
          </p>

          {/* Search Box / Interaction */}
          <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-xl border border-white p-2 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(102,5,199,0.1)]">
            <div className="p-8">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {POPULAR.slice(0, 10).map(c => (
                  <button
                    key={c}
                    onClick={() => toggleCountry(c)}
                    className={`px-5 py-2.5 rounded-2xl border font-bold text-sm transition-all duration-300 ${selected.includes(c)
                        ? 'bg-[#6605c7] text-white border-purple-600 shadow-lg shadow-purple-500/20'
                        : 'bg-white text-gray-600 border-gray-100 hover:border-purple-200 hover:bg-purple-50/30'
                      }`}
                  >
                    {c}
                  </button>
                ))}
                <button className="px-5 py-2.5 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-purple-300 hover:text-purple-400 transition-all">
                  + Other Countries
                </button>
              </div>

              <button
                onClick={search}
                disabled={loading || selected.length === 0}
                className="group relative px-10 py-5 rounded-[1.5rem] bg-[#6605c7] text-white font-black hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_15px_30px_rgba(102,5,199,0.3)] hover:shadow-purple-500/40 active:scale-[0.98] min-w-[240px]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Markets...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Search Universities</span>
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 pb-32">
        {/* Results Info Bar */}
        {(results.length > 0 || loading) && (
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {loading ? 'Finding Best Matches...' : `Found ${results.length} Institutions`}
              </h2>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Verified by GradRight & VidhyaLoan</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-2">Sort by:</span>
              <select className="bg-transparent border-0 text-gray-900 font-black text-sm focus:ring-0 cursor-pointer">
                <option>Global Rank</option>
                <option>Acceptance Rate</option>
                <option>Tuition (Low to High)</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {results.map((u) => (
              <UniversityCard
                key={`${u.name}-${u.country}`}
                university={u}
                onDetails={(x) => setActive(x)}
                onApply={(x) => setActive(x)}
              />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-32 bg-white/50 border-2 border-dashed border-gray-100 rounded-[3rem]">
            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-8 text-6xl shadow-sm">
              🏛️
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Your Journey Starts Here</h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">
              Select one or more countries and click search to discover top-tier universities for your study abroad adventure.
            </p>
          </div>
        )}

        {/* Features / Why VidhyaLoan? */}
        {!results.length && (
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'explore', title: 'Global Discovery', desc: 'Access 5000+ universities across 30 countries with up-to-date admission data.' },
              { icon: 'auto_graph', title: 'ROI Intelligence', desc: 'Predict your future earnings and loan repayment capacity with GradRight insights.' },
              { icon: 'account_balance', title: 'Smart Funding', desc: 'Check loan eligibility for specific programs before you even apply to the uni.' }
            ].map((f, i) => (
              <div key={i} className="p-10 bg-white rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                  <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* University Details Modal */}
      {active && <UniversityDetailsModal university={active} onClose={() => setActive(null)} />}
    </div>

  );
}
