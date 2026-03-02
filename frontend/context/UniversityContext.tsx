"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SelectedUniversity {
  name: string;
  country: string;
  alpha_two_code?: string;
  domains?: string[];
  web_pages?: string[];
  website?: string;
  aiEnhanced?: boolean;
  details?: any;
}

interface UniversityContextType {
  selectedUniversity: SelectedUniversity | null;
  setSelectedUniversity: (uni: SelectedUniversity | null) => void;
  clearSelection: () => void;
  updateUniversityDetails: (details: any) => void;
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

export function UniversityProvider({ children }: { children: React.ReactNode }) {
  const [selectedUniversity, setSelectedUniversityState] = useState<SelectedUniversity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("selectedUniversity");
      if (stored) {
        setSelectedUniversityState(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load university from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      if (selectedUniversity) {
        localStorage.setItem("selectedUniversity", JSON.stringify(selectedUniversity));
      } else {
        localStorage.removeItem("selectedUniversity");
      }
    }
  }, [selectedUniversity, isLoading]);

  const setSelectedUniversity = (uni: SelectedUniversity | null) => {
    setSelectedUniversityState(uni);
  };

  const clearSelection = () => {
    setSelectedUniversityState(null);
  };

  const updateUniversityDetails = (details: any) => {
    if (selectedUniversity) {
      setSelectedUniversityState({
        ...selectedUniversity,
        details,
        aiEnhanced: true,
      });
    }
  };

  return (
    <UniversityContext.Provider
      value={{
        selectedUniversity,
        setSelectedUniversity,
        clearSelection,
        updateUniversityDetails,
      }}
    >
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (context === undefined) {
    throw new Error("useUniversity must be used within UniversityProvider");
  }
  return context;
}
