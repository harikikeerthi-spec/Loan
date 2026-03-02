"use client";
import React from 'react';
import UniversityTemplate from './UniversityTemplate';
import { useUniversity } from '@/context/UniversityContext';

export default function UniversityCard({ university, onDetails, onApply }: { university: any; onDetails: (u: any) => void; onApply: (u: any) => void }) {
  const { selectedUniversity, setSelectedUniversity } = useUniversity();

  const isActive = selectedUniversity?.name === university.name && selectedUniversity?.country === university.country;

  const handleApply = (uni: any) => {
    setSelectedUniversity(uni);
    onApply(uni);
  };

  const handleDetails = (uni: any) => {
    setSelectedUniversity(uni);
    onDetails(uni);
  };

  return (
    <UniversityTemplate
      university={university}
      showFullDetails={false}
      isActive={isActive}
      onApply={handleApply}
      onDetails={handleDetails}
      aiEnhanced={selectedUniversity?.aiEnhanced}
    />
  );
}
