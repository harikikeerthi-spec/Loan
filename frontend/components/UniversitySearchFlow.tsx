"use client";

import React, { useState, useEffect } from "react";
import UniversityCard from "./UniversityCard";

interface University {
  name: string;
  country: string;
  city?: string;
  ranking?: number;
  worldRanking?: number;
  type?: string;
  website?: string;
  description?: string;
  popularCourses?: string[];
  averageFees?: string;
  acceptanceRate?: number;
  scholarships?: boolean;
}

export default function UniversitySearchFlow() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Fetch popular countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/popular-countries");
        if (response.ok) {
          const data = await response.json();
          setAvailableCountries(data.countries || []);
        } else {
          // Fallback to popular countries
          setAvailableCountries([
            "United States",
            "United Kingdom",
            "Canada",
            "Australia",
            "Germany",
            "France",
            "Netherlands",
            "Switzerland",
            "Singapore",
            "Japan",
            "New Zealand",
            "Sweden",
            "Ireland",
            "Spain",
            "Italy",
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);
        // Fallback countries
        setAvailableCountries([
          "United States",
          "United Kingdom",
          "Canada",
          "Australia",
          "Germany",
          "France",
          "Netherlands",
          "Switzerland",
          "Singapore",
          "Japan",
          "New Zealand",
          "Sweden",
          "Ireland",
          "Spain",
          "Italy",
        ]);
      }
    };
    fetchCountries();
  }, []);

  // Create frontend API route for popular countries
  const handleSearch = async () => {
    if (selectedCountries.length === 0) {
      alert("Please select at least one country");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch("/api/university-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countries: selectedCountries,
          limit: 10,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUniversities(data.universities || []);
      } else {
        console.error("Search failed:", data.message);
        setUniversities([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="w-full">
      {/* Search Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Universities</h2>

        {/* Country Selection */}
        <div className="relative mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Countries
          </label>
          <button
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left bg-white hover:border-purple-600 focus:border-purple-600 focus:outline-none transition-colors flex justify-between items-center"
          >
            <span>
              {selectedCountries.length === 0
                ? "Choose countries..."
                : `${selectedCountries.length} selected`}
            </span>
            <span className="text-gray-400">▼</span>
          </button>

          {/* Dropdown Menu */}
          {showCountryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              {availableCountries.map((country) => (
                <label
                  key={country}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country)}
                    onChange={() => toggleCountry(country)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700">{country}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selected Countries Tags */}
        {selectedCountries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCountries.map((country) => (
              <span
                key={country}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {country}
                <button
                  onClick={() => toggleCountry(country)}
                  className="text-purple-700 hover:text-purple-900 font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Searching..." : "Search Universities"}
        </button>
      </div>

      {/* Results Section */}
      {searched && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
              <p className="text-gray-600">Searching for universities...</p>
            </div>
          ) : universities.length > 0 ? (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Found {universities.length} Universities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {universities.map((uni, index) => (
                  <UniversityCard
                    key={`${uni.name}-${uni.country}`}
                    university={{
                      name: uni.name,
                      country: uni.country,
                      loc: uni.city || uni.country,
                      rank: uni.worldRanking || uni.ranking,
                      tuition: uni.averageFees
                        ? parseInt(uni.averageFees.replace(/[^0-9]/g, "")) || 25000
                        : 25000,
                      accept: uni.acceptanceRate || 20,
                      description: uni.description,
                      _score: 75 + Math.random() * 20, // Demo score
                      website: uni.website,
                      slug: uni.name.toLowerCase().replace(/\s+/g, "-"),
                      loan: true,
                    }}
                    onDetails={() => {}}
                    onApply={() => {}}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No universities found.</p>
              <p className="text-sm text-gray-500">
                Try selecting different countries or adjusting your search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
