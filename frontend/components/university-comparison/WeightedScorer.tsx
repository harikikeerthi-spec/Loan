"use client";

import { useState } from "react";

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

interface WeightedScorerProps {
  universities: University[];
  weights: {
    cost: number;
    roi: number;
    employability: number;
    reputation: number;
    culture: number;
  };
  onWeightsChange: (weights: any) => void;
}

export default function WeightedScorer({
  universities,
  weights,
  onWeightsChange,
}: WeightedScorerProps) {
  const calculateWeightedScore = (uni: University) => {
    // Normalize scores (0-100 scale)
    const costScore = 100 - (uni.tuition || 60000) / 600; // Lower cost = higher score
    const roiScore = (uni.avgjobSalary || 85000) / 1250; // Higher salary = higher score
    const employabilityScore = uni.employment || 85; // Employment %
    const reputationScore = Math.max(0, 100 - ((uni.rank || 50) / 50) * 100); // Better rank = higher score
    const cultureScore = 75; // Demo value

    const weightedScore =
      (costScore * weights.cost +
        roiScore * weights.roi +
        employabilityScore * weights.employability +
        reputationScore * weights.reputation +
        cultureScore * weights.culture) /
      (weights.cost +
        weights.roi +
        weights.employability +
        weights.reputation +
        weights.culture);

    return Math.min(100, Math.max(0, weightedScore));
  };

  const updateWeight = (key: string, value: number) => {
    onWeightsChange({
      ...weights,
      [key]: value,
    });
  };

  const sortedUnis = [...universities].sort(
    (a, b) => calculateWeightedScore(b) - calculateWeightedScore(a)
  );

  const maxScore = Math.max(...sortedUnis.map(calculateWeightedScore));

  return (
    <div className="space-y-8">
      {/* Weight Adjustment */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Customize Your Priorities
        </h3>

        <div className="space-y-6">
          {[
            {
              key: "cost",
              label: "Cost Efficiency",
              description: "Lower tuition and availability of scholarships",
              icon: "💰",
            },
            {
              key: "roi",
              label: "Return on Investment",
              description: "Starting salary and career growth potential",
              icon: "📈",
            },
            {
              key: "employability",
              label: "Employability",
              description: "Graduate employment rate",
              icon: "💼",
            },
            {
              key: "reputation",
              label: "Reputation & Rank",
              description: "World ranking and academic prestige",
              icon: "🏅",
            },
            {
              key: "culture",
              label: "Campus & Culture",
              description: "Student life and campus environment",
              icon: "🎓",
            },
          ].map((factor) => (
            <div key={factor.key} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {factor.icon} {factor.label}
                  </p>
                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {weights[factor.key as keyof typeof weights]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights[factor.key as keyof typeof weights]}
                onChange={(e) =>
                  updateWeight(factor.key, parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 mt-6">
          💡 Total weight: {Object.values(weights).reduce((a, b) => a + b, 0)}%
        </p>
      </div>

      {/* Ranked Results */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
          <h3 className="text-xl font-bold text-white">Ranked Results</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedUnis.map((uni, idx) => {
            const score = calculateWeightedScore(uni);
            const percentage = (score / maxScore) * 100;

            return (
              <div key={uni.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-purple-600">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {uni.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {uni.city}, {uni.country}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">
                      {score.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-600">/ 100</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Cost: </span>
                    <span className="font-semibold text-gray-900">
                      {(100 - (uni.tuition || 60000) / 600).toFixed(0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">ROI: </span>
                    <span className="font-semibold text-gray-900">
                      {((uni.avgjobSalary || 85000) / 1250).toFixed(0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employ: </span>
                    <span className="font-semibold text-gray-900">
                      {uni.employment || 85}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rank: </span>
                    <span className="font-semibold text-gray-900">
                      {Math.max(0, 100 - ((uni.rank || 50) / 50) * 100).toFixed(
                        0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Culture: </span>
                    <span className="font-semibold text-gray-900">75</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-3 justify-end">
        <button className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium">
          📋 Save Weighted Comparison
        </button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          📊 Export Ranking
        </button>
      </div>
    </div>
  );
}
