"use client";

import { useState } from "react";

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

interface ProfileBuilderProps {
  onComplete: (profile: UserProfile) => void;
}

const COUNTRIES = [
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "Netherlands",
  "Singapore",
  "Ireland",
];

export default function ProfileBuilder({ onComplete }: ProfileBuilderProps) {
  const [profile, setProfile] = useState<UserProfile>({
    gpa: null,
    englishScore: null,
    englishTest: "",
    testScore: null,
    testType: "",
    budget: null,
    workExperience: null,
    targetCountries: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profile.gpa || profile.gpa < 0 || profile.gpa > 4) {
      newErrors.gpa = "GPA must be between 0-4.0";
    }
    if (!profile.englishTest) {
      newErrors.englishTest = "Select an English proficiency test";
    }
    if (!profile.englishScore || profile.englishScore < 0) {
      newErrors.englishScore = "Enter a valid English score";
    }
    if (!profile.testType) {
      newErrors.testType = "Select a standardized test (GMAT/GRE)";
    }
    if (!profile.testScore || profile.testScore < 0) {
      newErrors.testScore = "Enter a valid test score";
    }
    if (!profile.budget || profile.budget < 0) {
      newErrors.budget = "Enter your annual budget";
    }
    if (!profile.workExperience || profile.workExperience < 0) {
      newErrors.workExperience = "Enter years of work experience";
    }
    if (profile.targetCountries.length === 0) {
      newErrors.targetCountries = "Select at least one country";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCountryToggle = (country: string) => {
    setProfile((prev) => ({
      ...prev,
      targetCountries: prev.targetCountries.includes(country)
        ? prev.targetCountries.filter((c) => c !== country)
        : [...prev.targetCountries, country],
    }));
    if (errors.targetCountries) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.targetCountries;
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(profile);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Tell Us About Yourself
      </h2>
      <p className="text-gray-600 mb-8">
        Your academic profile helps us find the perfect universities for you
      </p>

      <div className="space-y-8">
        {/* Academic Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GPA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPA / CGPA (0-4.0)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="3.8"
              value={profile.gpa || ""}
              onChange={(e) =>
                handleChange("gpa", parseFloat(e.target.value) || "")
              }
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.gpa ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.gpa && (
              <p className="text-red-500 text-sm mt-1">{errors.gpa}</p>
            )}
          </div>

          {/* Work Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Experience (Years)
            </label>
            <input
              type="number"
              placeholder="2"
              value={profile.workExperience || ""}
              onChange={(e) =>
                handleChange("workExperience", parseInt(e.target.value) || "")
              }
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.workExperience
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.workExperience && (
              <p className="text-red-500 text-sm mt-1">
                {errors.workExperience}
              </p>
            )}
          </div>
        </div>

        {/* English Proficiency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Test
            </label>
            <select
              value={profile.englishTest}
              onChange={(e) =>
                handleChange("englishTest", e.target.value)
              }
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.englishTest ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            >
              <option value="">Select test type</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEFL">TOEFL</option>
            </select>
            {errors.englishTest && (
              <p className="text-red-500 text-sm mt-1">{errors.englishTest}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score
            </label>
            <input
              type="number"
              step="0.5"
              placeholder={profile.englishTest === "IELTS" ? "7.5" : "105"}
              value={profile.englishScore || ""}
              onChange={(e) =>
                handleChange("englishScore", parseFloat(e.target.value) || "")
              }
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.englishScore
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.englishScore && (
              <p className="text-red-500 text-sm mt-1">{errors.englishScore}</p>
            )}
          </div>
        </div>

        {/* Standardized Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standardized Test
            </label>
            <select
              value={profile.testType}
              onChange={(e) => handleChange("testType", e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.testType ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            >
              <option value="">Select test type</option>
              <option value="GRE">GRE</option>
              <option value="GMAT">GMAT</option>
            </select>
            {errors.testType && (
              <p className="text-red-500 text-sm mt-1">{errors.testType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score
            </label>
            <input
              type="number"
              placeholder={profile.testType === "GRE" ? "330" : "700"}
              value={profile.testScore || ""}
              onChange={(e) =>
                handleChange("testScore", parseInt(e.target.value) || "")
              }
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.testScore ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.testScore && (
              <p className="text-red-500 text-sm mt-1">{errors.testScore}</p>
            )}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Budget ($)
          </label>
          <input
            type="number"
            placeholder="50000"
            value={profile.budget || ""}
            onChange={(e) =>
              handleChange("budget", parseInt(e.target.value) || "")
            }
            className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.budget ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.budget && (
            <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
          )}
        </div>

        {/* Target Countries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Which countries interest you?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COUNTRIES.map((country) => (
              <button
                key={country}
                onClick={() => handleCountryToggle(country)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  profile.targetCountries.includes(country)
                    ? "border-purple-600 bg-purple-50 text-purple-600"
                    : "border-gray-300 text-gray-700 hover:border-purple-400"
                }`}
              >
                {country}
              </button>
            ))}
          </div>
          {errors.targetCountries && (
            <p className="text-red-500 text-sm mt-1">{errors.targetCountries}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="w-full mt-8 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Continue to Program Selection →
      </button>
    </div>
  );
}
