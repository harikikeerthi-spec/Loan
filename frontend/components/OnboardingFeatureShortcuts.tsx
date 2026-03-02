"use client";

import Link from "next/link";

export default function OnboardingFeatureShortcuts() {
  return (
    <div
      className="max-w-4xl mx-auto px-4 py-16"
      style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Or explore our dedicated tools
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Skip the chat and jump directly to specialized tools designed for your specific needs
        </p>
      </div>

      {/* Three Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Loan Assistant */}
        <Link href="/loan-assistant" className="group block h-full">
          <div className="h-full p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Loan Assistant
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Get personalized loan eligibility assessment, product recommendations, EMI calculations, and document checklists.
            </p>
            <div className="pt-4 border-t border-green-200">
              <span className="text-green-600 font-semibold text-sm group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>
        </Link>

        {/* University Finder */}
        <Link href="/find-university" className="group block h-full">
          <div className="h-full p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Find Your University
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Build your profile, select programs, and get smart-matched universities based on your academic background and preferences.
            </p>
            <div className="pt-4 border-t border-purple-200">
              <span className="text-purple-600 font-semibold text-sm group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>
        </Link>

        {/* University Comparison */}
        <Link href="/compare-universities" className="group block h-full">
          <div className="h-full p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Compare Universities
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Search and compare up to 5 universities side-by-side with detailed metrics on cost, ROI, scholarships, and careers.
            </p>
            <div className="pt-4 border-t border-blue-200">
              <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Or Continue with Chat */}
      <div className="text-center mt-12">
        <p className="text-gray-600 text-sm mb-4">
          Or continue with our guided chatbot experience
        </p>
        <button onClick={() => window.location.href = "#start-guided"} className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
          Start Guided Interview →
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
