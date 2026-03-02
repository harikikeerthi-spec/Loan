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

interface ProductRecommendationProps {
  products: RecommendedProduct[];
  onSelect: (product: RecommendedProduct) => void;
  isLoading: boolean;
}

export default function ProductRecommendation({
  products,
  onSelect,
  isLoading,
}: ProductRecommendationProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Recommended Loan Products
      </h2>
      <p className="text-gray-600 mb-8">
        Based on your profile, here are the best-matched education loans for you
      </p>

      <div className="space-y-4">
        {products.map((product, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedIdx === idx
                ? "border-purple-600 bg-purple-50 shadow-lg"
                : "border-gray-200 bg-white hover:border-purple-400"
            }`}
          >
            {/* Match Score Badge */}
            <div className="absolute -top-3 -right-3">
              <div className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                {product.matchScore}% Match
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {product.bankName}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {product.productName}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-semibold text-gray-900">
                      {product.interestRate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Loan Amount:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(product.maxLoanAmount / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span className="font-semibold text-gray-900">
                      {product.processingFee}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repayment Period:</span>
                    <span className="font-semibold text-gray-900">
                      {product.repaymentPeriod}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Features */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Key Features
                </p>
                <ul className="space-y-2">
                  {product.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedIdx === idx && (
              <div className="mt-6 pt-6 border-t border-purple-200">
                <button
                  onClick={() => onSelect(product)}
                  className="w-full px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Choose This Product →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> We negotiate with lenders to secure the best
          rates for you. All offers shown are pre-approved for your profile.
        </p>
      </div>
    </div>
  );
}
