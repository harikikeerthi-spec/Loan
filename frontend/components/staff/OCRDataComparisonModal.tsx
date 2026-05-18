"use client";
/**
 * OCR Data Comparison & Auto-Population Modal
 * Compares extracted OCR data with current profile values
 * Allows staff to review and sync individual fields
 */

import { useState } from "react";
import { format } from "date-fns";

interface OCRExtractedData {
  document_type: string;
  confidence_score: number; 
  extracted_data: {
    full_name?: string;
    date_of_birth?: string;
    document_number?: string;
    father_name?: string;
    expiry_date?: string | null;
    issuing_authority?: string;
    [key: string]: any;
  };
  verification_flags?: {
    is_expired?: boolean;
    name_match_score?: number;
  };
}

interface FieldComparison {
  fieldName: string;
  currentValue: string | null;
  extractedValue: string | null;
  extractedKey: string;
  hasConflict: boolean;
}

interface OCRDataComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentImage: string | null;
  ocrData: OCRExtractedData | null;
  currentProfile: { [key: string]: any };
  onSyncField: (fieldKey: string, value: string, extractedKey: string) => void;
  onSyncAll: (mappedData: { [key: string]: string }) => void;
  loading?: boolean;
}

// Field mapping from OCR keys to profile keys
const FIELD_MAPPING: { [key: string]: { label: string; ocrKey: string; profileKey: string } } = {
  full_name: { label: "Full Name", ocrKey: "full_name", profileKey: "firstName" },
  date_of_birth: { label: "Date of Birth", ocrKey: "date_of_birth", profileKey: "dob" },
  document_number: { label: "Document Number", ocrKey: "document_number", profileKey: "panNumber" },
  aadhaar_number: { label: "Aadhaar Number", ocrKey: "aadhaar_number", profileKey: "aadhaarNumber" },
  father_name: { label: "Father's Name", ocrKey: "father_name", profileKey: "fatherName" },
  expiry_date: { label: "Expiry Date", ocrKey: "expiry_date", profileKey: "expiryDate" },
  gender: { label: "Gender", ocrKey: "gender", profileKey: "gender" },
  address: { label: "Address", ocrKey: "address", profileKey: "permanentAddress" },
};

export default function OCRDataComparisonModal({
  isOpen,
  onClose,
  documentImage,
  ocrData,
  currentProfile,
  onSyncField,
  onSyncAll,
  loading = false,
}: OCRDataComparisonModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [syncingField, setSyncingField] = useState<string | null>(null);

  if (!isOpen || !ocrData) return null;

  // Build comparison data
  const comparisons: FieldComparison[] = Object.entries(FIELD_MAPPING)
    .filter(([_, mapping]) => ocrData.extracted_data[mapping.ocrKey] !== undefined)
    .map(([key, mapping]) => {
      const extractedValue = ocrData.extracted_data[mapping.ocrKey];
      const currentValue = currentProfile[mapping.profileKey];
      const hasConflict = extractedValue && currentValue && extractedValue !== currentValue;

      return {
        fieldName: mapping.label,
        currentValue: currentValue || null,
        extractedValue: extractedValue || null,
        extractedKey: mapping.ocrKey,
        hasConflict,
      };
    });

  const handleToggleField = (extractedKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(extractedKey)) {
      newSelected.delete(extractedKey);
    } else {
      newSelected.add(extractedKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSyncField = async (comparison: FieldComparison) => {
    setSyncingField(comparison.extractedKey);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate API call
      onSyncField(comparison.extractedKey, comparison.extractedValue || "", comparison.extractedKey);
    } finally {
      setSyncingField(null);
    }
  };

  const handleSyncAll = async () => {
    const mappedData: { [key: string]: string } = {};
    selectedFields.forEach((extractedKey) => {
      const comparison = comparisons.find((c) => c.extractedKey === extractedKey);
      if (comparison) {
        // Find the profile key for this extracted key
        const mapping = Object.values(FIELD_MAPPING).find((m) => m.ocrKey === extractedKey);
        if (mapping) {
          mappedData[mapping.profileKey] = comparison.extractedValue || "";
        }
      }
    });

    if (Object.keys(mappedData).length > 0) {
      onSyncAll(mappedData);
      setSelectedFields(new Set());
    }
  };

  const confidenceColor =
    ocrData.confidence_score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : ocrData.confidence_score >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">OCR Data Extraction Review</h2>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                {ocrData.document_type} • {comparisons.length} fields detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex gap-6 p-6">
          {/* Left: Document Image */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="aspect-[3/4] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative group">
              {documentImage ? (
                <>
                  <img src={documentImage} alt="Document" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-2 block">image_not_supported</span>
                  <p className="text-sm text-slate-500 font-medium">Document image not available</p>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-xl border ${confidenceColor} text-center`}>
              <p className="text-[11px] font-black uppercase tracking-widest mb-1">Confidence Score</p>
              <p className="text-2xl font-bold">{ocrData.confidence_score}%</p>
            </div>
          </div>

          {/* Right: Comparison Table */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="space-y-3 overflow-y-auto flex-1 pr-3">
              {comparisons.length > 0 ? (
                comparisons.map((comparison) => (
                  <div
                    key={comparison.extractedKey}
                    className={`p-4 rounded-xl border transition-all ${
                      comparison.hasConflict ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                    } ${selectedFields.has(comparison.extractedKey) ? "ring-2 ring-indigo-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          {comparison.fieldName}
                        </p>
                        {comparison.hasConflict && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            Data Mismatch
                          </span>
                        )}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFields.has(comparison.extractedKey)}
                          onChange={() => handleToggleField(comparison.extractedKey)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-600">Sync</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      {/* Current Value */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Value</p>
                        <p className="text-[13px] font-semibold text-slate-700">
                          {comparison.currentValue || <span className="text-slate-400 italic">— Not set</span>}
                        </p>
                      </div>

                      {/* Extracted Value */}
                      <div className="flex items-center gap-2">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex-1">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                            Extracted Value
                          </p>
                          <p className="text-[13px] font-semibold text-emerald-700">{comparison.extractedValue}</p>
                        </div>
                        <button
                          onClick={() => handleSyncField(comparison)}
                          disabled={syncingField === comparison.extractedKey || loading}
                          className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="Sync this field"
                        >
                          {syncingField === comparison.extractedKey ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">sync</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">info</span>
                  <p className="text-sm font-medium">No data extracted from document</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSyncAll}
                disabled={selectedFields.size === 0 || loading}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    Syncing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Sync {selectedFields.size > 0 ? `${selectedFields.size}` : ""} Fields
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
