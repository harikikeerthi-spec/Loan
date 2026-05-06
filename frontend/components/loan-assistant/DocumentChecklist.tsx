"use client";

import { useState } from "react";

type RecommendedProduct = {
  bankName: string;
  productName: string;
  interestRate: string;
  maxLoanAmount: number;
  processingFee: string;
  repaymentPeriod: string;
  matchScore: number;
  features: string[];
};

interface DocumentChecklistProps {
  loanProduct: RecommendedProduct | null;
  onComplete: (documents: string[]) => void;
}

const REQUIRED_DOCUMENTS = [
  {
    id: "uid",
    name: "Aadhaar Card",
    description: "For identity verification",
    category: "Identity",
  },
  {
    id: "pan",
    name: "PAN Card",
    description: "For income verification",
    category: "Identity",
  },
  {
    id: "10-12",
    name: "10th & 12th Marksheet",
    description: "Academic records",
    category: "Academic",
  },
  {
    id: "bachelor",
    name: "Bachelor's Degree Certificate",
    description: "Latest qualification",
    category: "Academic",
  },
  {
    id: "admission",
    name: "University Admission Letter",
    description: "From your selected university",
    category: "Academic",
  },
  {
    id: "bank",
    name: "Bank Statements (6 months)",
    description: "Recent bank account statements",
    category: "Financial",
  },
  {
    id: "itr",
    name: "Income Tax Returns",
    description: "Last 2 years ITR",
    category: "Financial",
  },
  {
    id: "salary",
    name: "Salary Slips",
    description: "Last 3-6 months salary slips",
    category: "Financial",
  },
  {
    id: "insurance",
    name: "Insurance Policies",
    description: "Life insurance (optional but recommended)",
    category: "Financial",
  },
  {
    id: "application",
    name: "University Application",
    description: "Application confirmation document",
    category: "Academic",
  },
];

export default function DocumentChecklist({
  loanProduct,
  onComplete,
}: DocumentChecklistProps) {
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);

  const handleToggle = (docId: string) => {
    setCheckedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const handleContinue = () => {
    // In a real scenario, we'd validate that all required docs are checked
    onComplete(checkedDocs);
  };

  const categories = ["Identity", "Academic", "Financial"];
  const docsByCategory = Object.fromEntries(
    categories.map((cat) => [
      cat,
      REQUIRED_DOCUMENTS.filter((doc) => doc.category === cat),
    ])
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Gather Required Documents
      </h2>
      <p className="text-gray-600 mb-8">
        Keep these documents ready for your {loanProduct?.bankName} loan
        application
      </p>

      {/* Summary Card */}
      <div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Selected Product:</span>{" "}
          {loanProduct?.productName} by {loanProduct?.bankName}
        </p>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {category} Documents
            </h3>
            <div className="space-y-3">
              {docsByCategory[category].map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-400 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedDocs.includes(doc.id)}
                    onChange={() => handleToggle(doc.id)}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Note */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          ⏱️ <strong>Estimated Time:</strong> Submitting and verifying all
          documents usually takes 1-2 business days
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleContinue}
          disabled={checkedDocs.length === 0}
          className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continue with {checkedDocs.length} documents →
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        You can upload remaining documents later in your application portal
      </p>
    </div>
  );
}
