"use client";

import { useState, useEffect } from "react";
import ComparisonGrid from "./university-comparison/ComparisonGrid";
import MetricComparison from "./university-comparison/MetricComparison";
import WeightedScorer from "./university-comparison/WeightedScorer";

type University = {
  id: string;
  name: string;
  country: string;
  city: string;
  logo?: string;
  rank?: number;
  accept?: number;
  tuition?: number;
  description?: string;
  slug?: string;
  website?: string;
  _score?: number;
  loan?: boolean;
  scholarships?: number;
  avgjobSalary?: number;
  employment?: number;
  topRecruiters?: string[];
};

type ComparisonMetrics = {
  tuitionCost: number;
  livingCost: number;
  scholarshipsAvailable: number;
  acceptanceRate: number;
  startingSalary: number;
  employmentRate: number;
  worldRank: number;
};

interface UniversityComparisonFlowProps {
  initialUnis?: string[];
}

export default function UniversityComparisonFlow({
  initialUnis = [],
}: UniversityComparisonFlowProps) {
  const [selectedUnis, setSelectedUnis] = useState<University[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<University[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "metrics" | "weighted">("grid");
  const [weights, setWeights] = useState({
    cost: 20,
    roi: 20,
    employability: 20,
    reputation: 20,
    culture: 20,
  });

  const demoUnis: University[] = [
    {
      id: "1",
      name: "Stanford University",
      country: "USA",
      city: "Palo Alto, CA",
      rank: 1,
      accept: 3,
      tuition: 60000,
      scholarships: 1200000,
      avgjobSalary: 120000,
      employment: 95,
      topRecruiters: ["Google", "Apple", "Microsoft", "Meta", "Tesla"],
      description: "Leading tech university",
      slug: "stanford",
      website: "https://www.stanford.edu",
      loan: true,
      _score: 95,
    },
    {
      id: "2",
      name: "MIT",
      country: "USA",
      city: "Cambridge, MA",
      rank: 2,
      accept: 2,
      tuition: 65000,
      scholarships: 1400000,
      avgjobSalary: 125000,
      employment: 97,
      topRecruiters: ["Google", "Meta", "Microsoft", "Amazon", "JPMorgan"],
      description: "Premier engineering school",
      slug: "mit",
      website: "https://www.mit.edu",
      loan: true,
      _score: 92,
    },
    {
      id: "3",
      name: "University of Cambridge",
      country: "UK",
      city: "Cambridge",
      rank: 3,
      accept: 4,
      tuition: 35000,
      scholarships: 900000,
      avgjobSalary: 85000,
      employment: 92,
      topRecruiters: ["Goldman Sachs", "McKinsey", "BCG", "Deloitte", "KPMG"],
      description: "Historic research university",
      slug: "cambridge",
      website: "https://www.cam.ac.uk",
      loan: true,
      _score: 90,
    },
  ];

  useEffect(() => {
    // If initialUnis provided, load them
    if (initialUnis.length > 0) {
      const unis = demoUnis.filter((u) =>
        initialUnis.some((id) => u.id === id || u.slug === id)
      );
      setSelectedUnis(unis);
    }
  }, [initialUnis]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = demoUnis.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.country.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddUni = (uni: University) => {
    if (!selectedUnis.find((u) => u.id === uni.id) && selectedUnis.length < 5) {
      setSelectedUnis([...selectedUnis, uni]);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleRemoveUni = (id: string) => {
    setSelectedUnis(selectedUnis.filter((u) => u.id !== id));
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6605c7]/[0.05] rounded-lg text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-[14px]">school</span>
            University Comparison
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compare Universities
          </h1>
          <p className="text-[13px] text-gray-500 max-w-xl leading-relaxed">
            Side-by-side comparison of cost, ROI, scholarships, and career outcomes for top universities worldwide.
          </p>
        </div>

        {/* Search & Selection */}
        <div className="mb-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Add Universities to Compare
          </h2>

          {/* Search Input */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            </div>
            <input
              type="text"
              placeholder="Search by name or country..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/[0.1] focus:border-[#6605c7] transition-all text-[13px] outline-none"
            />

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                {searchResults.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => handleAddUni(uni)}
                    className="w-full text-left px-5 py-3 hover:bg-[#6605c7]/[0.02] border-b border-gray-50 last:border-b-0 transition-colors"
                  >
                    <p className="font-bold text-gray-900 text-[13px]">{uni.name}</p>
                    <p className="text-[11px] text-gray-500 uppercase tracking-tight mt-0.5">
                      {uni.city}, {uni.country} • Rank #{uni.rank}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Universities */}
          <div className="flex flex-wrap gap-2">
            {selectedUnis.map((uni) => (
              <div
                key={uni.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#6605c7]/[0.03] border border-[#6605c7]/[0.08] rounded-lg"
              >
                <span className="text-[11px] font-bold text-gray-900">
                  {uni.name}
                </span>
                <button
                  onClick={() => handleRemoveUni(uni.id)}
                  className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-[#6605c7]/[0.1] text-[#6605c7] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
            {selectedUnis.length === 0 && (
              <p className="text-[11px] text-gray-400 italic py-2">No universities selected yet.</p>
            )}
          </div>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
            {selectedUnis.length} / 5 Selected
          </p>
        </div>

        {/* View Mode Selector */}
        {selectedUnis.length >= 2 && (
          <div className="mb-6 bg-white rounded-xl border border-gray-100 p-2 shadow-sm flex items-center gap-1 inline-flex">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${viewMode === "grid"
                  ? "bg-[#6605c7] text-white shadow-md shadow-purple-500/20"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              📊 Grid View
            </button>
            <button
              onClick={() => setViewMode("metrics")}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${viewMode === "metrics"
                  ? "bg-[#6605c7] text-white shadow-md shadow-purple-500/20"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              📈 Metrics
            </button>
            <button
              onClick={() => setViewMode("weighted")}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${viewMode === "weighted"
                  ? "bg-[#6605c7] text-white shadow-md shadow-purple-500/20"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              ⚖️ Weights
            </button>
          </div>
        )}

        {/* Comparison Views */}
        {selectedUnis.length >= 2 ? (
          <div className="mt-6">
            {viewMode === "grid" && (
              <ComparisonGrid universities={selectedUnis} />
            )}
            {viewMode === "metrics" && (
              <MetricComparison universities={selectedUnis} />
            )}
            {viewMode === "weighted" && (
              <WeightedScorer
                universities={selectedUnis}
                weights={weights}
                onWeightsChange={setWeights}
              />
            )}
          </div>
        ) : (
          <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-12 text-center h-64 flex flex-col justify-center items-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-400 text-2xl">compare_arrows</span>
            </div>
            <p className="text-gray-500 text-[13px] mb-1">
              Select at least 2 universities to start comparing
            </p>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">
              Add more above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
