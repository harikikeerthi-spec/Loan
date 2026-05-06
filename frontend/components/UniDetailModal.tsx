"use client";

import React from "react";
import UniversityDetailView from "./UniversityDetailView";

interface UniDetailModalProps {
    university: any;
    onClose: () => void;
    answers?: any; // Keep for compatibility if used
}

export default function UniDetailModal({ university, onClose }: UniDetailModalProps) {
    if (!university) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <UniversityDetailView university={university} onClose={onClose} />
        </div>
    );
}
