"use client";

import { useState, useEffect } from "react";
import ProfileBuilder from "./university-finder/ProfileBuilder";
import ProgramExplorer from "./university-finder/ProgramExplorer";
import SmartMatches from "./university-finder/SmartMatches";
import UniversityCard from "./UniversityCard";

type Step = "profile" | "programs" | "matches" | "results";

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

export default function UniversityFinderFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("profile");
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
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [matchedUniversities, setMatchedUniversities] = useState<University[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Handle profile completion
  const handleProfileComplete = (profileData: UserProfile) => {
    setProfile(profileData);
    setCurrentStep("programs");
  };

  // Handle program selection
  const handleProgramsSelect = async (programs: string[]) => {
    setSelectedPrograms(programs);
    setIsLoading(true);

    // Simulate API call to match universities
    try {
      // In real scenario: POST /ai/match-universities with profile + programs
      const demoMatches: University[] = [
        {
          name: "Stanford University",
          country: "USA",
          loc: "California, USA",
          rank: 1,
          accept: 3,
          tuition: 60000,
          _score: 95,
          description: "World-leading university in tech and engineering",
          slug: "stanford-university",
          loan: true,
          website: "https://www.stanford.edu",
        },
        {
          name: "MIT",
          country: "USA",
          loc: "Cambridge, USA",
          rank: 2,
          accept: 2,
          tuition: 65000,
          _score: 92,
          description: "Premier engineering and computer science",
          slug: "mit",
          loan: true,
          website: "https://www.mit.edu",
        },
        {
          name: "University of Cambridge",
          country: "UK",
          loc: "Cambridge, UK",
          rank: 3,
          accept: 4,
          tuition: 35000,
          _score: 90,
          description: "Historic university with world-class programs",
          slug: "cambridge",
          loan: true,
          website: "https://www.cam.ac.uk",
        },
        {
          name: "University of Oxford",
          country: "UK",
          loc: "Oxford, UK",
          rank: 4,
          accept: 5,
          tuition: 33000,
          _score: 88,
          description: "Leading research university",
          slug: "oxford",
          loan: true,
          website: "https://www.ox.ac.uk",
        },
        {
          name: "ETH Zurich",
          country: "Switzerland",
          loc: "Zurich, Switzerland",
          rank: 5,
          accept: 6,
          tuition: 1500,
          _score: 87,
          description: "Excellence in engineering and technology",
          slug: "eth-zurich",
          loan: true,
          website: "https://www.ethz.ch",
        },
        {
          name: "University of Toronto",
          country: "Canada",
          loc: "Toronto, Canada",
          rank: 8,
          accept: 12,
          tuition: 35000,
          _score: 82,
          description: "Canada's leading research university",
          slug: "toronto",
          loan: true,
          website: "https://www.utoronto.ca",
        },
      ];
      setMatchedUniversities(demoMatches);
      setCurrentStep("results");
    } catch (error) {
      console.error("Error matching universities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header - Refined */}
        <div className="text-center mb-16 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-purple-100 shadow-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">AI Intelligence Engine</span>
            <span className="w-px h-3 bg-purple-100 mx-1" />
            <span className="text-[10px] font-bold text-gray-400">Powered by GradRight</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
            Discover Your Perfect <br /><span className="text-[#6605c7] italic">Match</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Our proprietary algorithms analyze 50,000+ data points to find institutions that align with your academic DNA and ROI goals.
          </p>
        </div>

        {/* Progress Indicator - Minimal & Premium */}
        <div className="mb-16 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8 relative">
            {/* Connecting Line */}
            <div className="absolute top-[1.125rem] left-0 right-0 h-0.5 bg-gray-100 -z-10" />
            <div
              className="absolute top-[1.125rem] left-0 h-0.5 bg-[#6605c7] -z-10 transition-all duration-700"
              style={{ width: `${(['profile', 'programs', 'results'].indexOf(currentStep ?? 'profile')) * 50}%` }}
            />

            {[
              { id: 'profile', label: 'Academic Profile', icon: 'person' },
              { id: 'programs', label: 'Program Choice', icon: 'explore' },
              { id: 'results', label: 'Smart Matches', icon: 'auto_awesome' }
            ].map((s, idx) => {
              const stepIndex = ['profile', 'programs', 'results'].indexOf(currentStep ?? 'profile');
              const isPast = stepIndex > idx;
              const isCurrent = stepIndex === idx;

              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isCurrent
                        ? 'bg-[#6605c7] text-white border-purple-600 shadow-[0_10px_20px_rgba(102,5,199,0.3)]'
                        : isPast
                          ? 'bg-white text-[#6605c7] border-purple-100 shadow-sm'
                          : 'bg-white text-gray-300 border-gray-100'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPast ? 'check' : s.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest mt-4 transition-colors ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Card - Clean Workspace */}
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-8 md:p-12">
            {currentStep === "profile" && (
              <ProfileBuilder onComplete={handleProfileComplete} />
            )}

            {currentStep === "programs" && (
              <ProgramExplorer
                profile={profile}
                onComplete={handleProgramsSelect}
                isLoading={isLoading}
              />
            )}

            {currentStep === "results" && (
              <SmartMatches
                universities={matchedUniversities}
                profile={profile}
                programs={selectedPrograms}
                onBack={() => {
                  setCurrentStep("programs");
                  setSelectedPrograms([]);
                }}
              />
            )}
          </div>
        </div>

        {/* Support Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All Data Encrypted & Secured
          </p>
        </div>
      </div>
    </div>

  );
}
