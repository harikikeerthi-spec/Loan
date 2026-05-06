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

interface ProgramExplorerProps {
  profile: UserProfile;
  onComplete: (programs: string[]) => void;
  isLoading: boolean;
}

const POPULAR_PROGRAMS = [
  { name: "Computer Science", icon: "💻", color: "from-blue-100 to-blue-50" },
  { name: "Data Science", icon: "📊", color: "from-purple-100 to-purple-50" },
  { name: "MBA", icon: "🎓", color: "from-green-100 to-green-50" },
  { name: "Engineering", icon: "⚙️", color: "from-orange-100 to-orange-50" },
  { name: "Business Analytics", icon: "📈", color: "from-red-100 to-red-50" },
  { name: "Artificial Intelligence", icon: "🤖", color: "from-indigo-100 to-indigo-50" },
  { name: "Finance", icon: "💰", color: "from-yellow-100 to-yellow-50" },
  { name: "Healthcare", icon: "⚕️", color: "from-pink-100 to-pink-50" },
  { name: "Environmental Science", icon: "🌱", color: "from-teal-100 to-teal-50" },
  { name: "Marketing", icon: "📢", color: "from-cyan-100 to-cyan-50" },
  { name: "Law", icon: "⚖️", color: "from-slate-100 to-slate-50" },
  { name: "Architecture", icon: "🏗️", color: "from-amber-100 to-amber-50" },
];

export default function ProgramExplorer({
  profile,
  onComplete,
  isLoading,
}: ProgramExplorerProps) {
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [customProgram, setCustomProgram] = useState("");

  const handleToggleProgram = (program: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(program)
        ? prev.filter((p) => p !== program)
        : [...prev, program]
    );
  };

  const handleAddCustom = () => {
    if (customProgram.trim() && !selectedPrograms.includes(customProgram)) {
      setSelectedPrograms((prev) => [...prev, customProgram]);
      setCustomProgram("");
    }
  };

  const handleContinue = () => {
    if (selectedPrograms.length > 0) {
      onComplete(selectedPrograms);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Select Programs of Interest
      </h2>
      <p className="text-gray-600 mb-8">
        Choose the programs you're interested in. We'll find universities
        offering these and matching your profile.
      </p>

      {/* Profile Summary */}
      <div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <strong>GPA:</strong> {profile.gpa}
          </span>
          <span>
            <strong>{profile.englishTest}:</strong> {profile.englishScore}
          </span>
          <span>
            <strong>Budget:</strong> ${profile.budget}
          </span>
          <span>
            <strong>Countries:</strong> {profile.targetCountries.join(", ")}
          </span>
        </div>
      </div>

      {/* Popular Programs Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Popular Programs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {POPULAR_PROGRAMS.map((prog) => (
            <button
              key={prog.name}
              onClick={() => handleToggleProgram(prog.name)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                selectedPrograms.includes(prog.name)
                  ? "border-purple-600 bg-purple-50 shadow-md"
                  : `border-gray-200 bg-white hover:border-purple-400 bg-gradient-to-b ${prog.color}`
              }`}
            >
              <div className="text-3xl mb-2">{prog.icon}</div>
              <div className="text-sm font-medium text-gray-900">
                {prog.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Program */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Looking for something else?
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Cybersecurity, Environmental Engineering"
            value={customProgram}
            onChange={(e) => setCustomProgram(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddCustom()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAddCustom}
            className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Programs Display */}
      {selectedPrograms.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Selected Programs ({selectedPrograms.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedPrograms.map((prog) => (
              <span
                key={prog}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 border border-purple-300 text-purple-900 rounded-full text-sm font-medium"
              >
                {prog}
                <button
                  onClick={() => handleToggleProgram(prog)}
                  className="text-purple-600 hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleContinue}
          disabled={selectedPrograms.length === 0 || isLoading}
          className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {isLoading
            ? "Finding universities..."
            : `Find Universities in ${selectedPrograms.length} Program${
                selectedPrograms.length !== 1 ? "s" : ""
              } →`}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can select multiple programs. We'll find
          universities offering them with consideration for your academic profile
          and budget.
        </p>
      </div>
    </div>
  );
}
