"use client";

import React, { useEffect } from 'react';
import { useUniversity } from '@/context/UniversityContext';

export default function SelectedUniversityWidget() {
  const { selectedUniversity, clearSelection } = useUniversity();
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    setIsVisible(!!selectedUniversity);
  }, [selectedUniversity]);

  if (!isVisible || !selectedUniversity) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 p-4 bg-white rounded-2xl shadow-xl border border-purple-200 max-w-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">
            Selected University
          </div>
          <h3 className="text-sm font-black text-gray-900 mt-1">
            {selectedUniversity.name}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {selectedUniversity.country}
          </p>
          {selectedUniversity.aiEnhanced && (
            <span className="inline-block mt-2 text-[9px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
              AI Enhanced ✓
            </span>
          )}
        </div>
        <button
          onClick={clearSelection}
          className="text-gray-400 hover:text-gray-600 font-bold mt-1"
        >
          ✕
        </button>
      </div>

      <a
        href={`/apply-loan?university=${encodeURIComponent(selectedUniversity.name)}&country=${encodeURIComponent(selectedUniversity.country)}`}
        className="mt-3 block w-full px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors text-center"
      >
        Proceed to Apply →
      </a>
    </div>
  );
}
