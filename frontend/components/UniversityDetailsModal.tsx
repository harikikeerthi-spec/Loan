"use client";
import React, { useEffect } from 'react';
import UniversityTemplate from './UniversityTemplate';
import { useUniversity } from '@/context/UniversityContext';

export default function UniversityDetailsModal({ university, onClose }: { university: any | null; onClose: () => void; }) {
  const { setSelectedUniversity } = useUniversity();

  useEffect(() => {
    if (university) {
      setSelectedUniversity(university);
    }
  }, [university, setSelectedUniversity]);

  if (!university) return null;

  const handleApply = (uni: any) => {
    window.location.href = `/apply-loan?university=${encodeURIComponent(uni.name)}&country=${encodeURIComponent(uni.country)}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-md transition-opacity" />

      <div
        className="relative z-10 w-full max-w-5xl max-h-[95vh] rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-full overflow-y-auto bg-white custom-scrollbar">
          <UniversityTemplate
            university={university}
            showFullDetails={true}
            onApply={handleApply}
            onDetails={() => onClose()} // Use for close
          />
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
