"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UniversityCard from "../UniversityCard";

type UserProfile = {
  gpa: number | null;
  englishScore: number | null;
  englishTest: "IELTS" | "TOEFL" | "";
  testScore: number | null;
  testType: "GMAT" | "GRE" | "";
  budget: number | null;
  workExperience: number | null;
  targetCountries: string[];
};

type University = {
  name: string;
  country: string;
  loc: string;
  rank?: number;
  accept?: number;
  tuition?: number;
  _score?: number;
  description?: string;
  slug?: string;
  loan?: boolean;
  website?: string;
};

interface SmartMatchesProps {
  universities: University[];
  profile: UserProfile;
  programs: string[];
  onBack: () => void;
}

export default function SmartMatches({
  universities,
  profile,
  programs,
  onBack,
}: SmartMatchesProps) {
  const router = useRouter();
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "rank" | "cost">("match");

  const handleSelectUni = (name: string) => {
    setSelectedUnis((prev) =>
      prev.includes(name)
        ? prev.filter((u) => u !== name)
        : [...prev.slice(-1).concat([name])]
    );
  };

  const handleCompare = () => {
    if (selectedUnis.length > 0) {
      // Could redirect to comparison page with selected universities
      alert(
        `Compare: ${selectedUnis.join(", ")} - comparison feature coming soon`
      );
    }
  };

  const handleSaveProfile = () => {
    // Save profile to user dashboard
    alert(
      "Profile saved! You can view recommendations anytime from your dashboard."
    );
  };

  const sortedUniversities = [...universities].sort((a, b) => {
    if (sortBy === "match") return (b._score || 0) - (a._score || 0);
    if (sortBy === "rank") return (a.rank || 999) - (b.rank || 999);
    if (sortBy === "cost") return (a.tuition || 999999) - (b.tuition || 999999);
    return 0;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Smart Matches
          </h2>
          <p className="text-gray-600">
            {universities.length} universities match your profile. Ranked by your
            compatibility.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          ← Change preferences
        </button>
      </div>

      {/* Filter and Sort */}
      <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-3">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "match" | "rank" | "cost")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="match">Best Match</option>
            <option value="rank">World Rank</option>
            <option value="cost">Cost (Low to High)</option>
          </select>
        </div>

        <button
          onClick={handleSaveProfile}
          className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
        >
          💾 Save Profile
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Avg Acceptance</p>
          <p className="text-2xl font-bold text-blue-600">
            {(
              universities.reduce((a, b) => a + (b.accept || 0), 0) /
              universities.length
            ).toFixed(1)}
            %
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Avg Cost/Year</p>
          <p className="text-2xl font-bold text-green-600">
            $
            {(
              universities.reduce((a, b) => a + (b.tuition || 0), 0) /
              universities.length /
              1000
            ).toFixed(0)}
            k
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">Programs Selected</p>
          <p className="text-2xl font-bold text-purple-600">{programs.length}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-gray-600">Loan Ready</p>
          <p className="text-2xl font-bold text-orange-600">
            {universities.filter((u) => u.loan).length}/
            {universities.length}
          </p>
        </div>
      </div>

      {/* Universities List */}
      <div className="space-y-4 mb-8">
        {sortedUniversities.map((uni, idx) => (
          <div key={uni.name} className="relative">
            <UniversityCard university={uni} onDetails={() => {}} onApply={() => {}} />

            {/* Selection Checkbox Overlay */}
            <label className="absolute top-4 right-20 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUnis.includes(uni.name)}
                onChange={() => handleSelectUni(uni.name)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600"
              />
              <span className="text-sm font-medium text-gray-700">Select</span>
            </label>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleCompare}
          disabled={selectedUnis.length === 0}
          className="flex-1 px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          📊 Compare ({selectedUnis.length} selected)
        </button>
        <button
          onClick={() => handleSaveProfile()}
          className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          💾 Save to Dashboard
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Next Steps:</strong> Use our loan assistant to explore
          education financing options for these universities.{" "}
          <a
            href="/loan-assistant"
            className="font-bold text-blue-900 hover:underline"
          >
            Get Started →
          </a>
        </p>
      </div>
    </div>
  );
}
