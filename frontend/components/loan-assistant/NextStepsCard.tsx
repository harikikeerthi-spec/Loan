"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface NextStepsCardProps {
  loanProduct: RecommendedProduct | null;
  onStartApplication: () => void;
}

export default function NextStepsCard({
  loanProduct,
  onStartApplication,
}: NextStepsCardProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<"apply" | "contact">(
    "apply"
  );

  const handleStartApplication = () => {
    onStartApplication();
    // Redirect to application form with pre-filled product
    // router.push(`/apply-loan?bank=${loanProduct?.bankName}`);
  };

  const handleContactExpert = () => {
    // In real scenario, this would open a chat or scheduling interface
    alert("Our loan experts will contact you within 2 hours!");
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Ready to Apply?
      </h2>
      <p className="text-gray-600 mb-8">
        You're one step away from securing your education loan
      </p>

      {/* Application Summary Card */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Your Application Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Bank</p>
            <p className="text-lg font-semibold text-gray-900">
              {loanProduct?.bankName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Product</p>
            <p className="text-lg font-semibold text-gray-900">
              {loanProduct?.productName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
            <p className="text-lg font-semibold text-purple-600">
              {loanProduct?.interestRate}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Max Loan Amount</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{(loanProduct?.maxLoanAmount || 0) / 100000}L
            </p>
          </div>
        </div>
      </div>

      {/* EMI Estimate Card */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Quick EMI Estimate
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Loan Amount
            </label>
            <input
              type="number"
              placeholder="₹30,00,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Loan Tenure (Years)
            </label>
            <input
              type="number"
              placeholder="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Interest Rate
            </label>
            <input
              type="text"
              placeholder={loanProduct?.interestRate}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Estimated Monthly EMI</p>
          <p className="text-3xl font-bold text-green-600">₹20,500</p>
          <p className="text-xs text-gray-600 mt-2">
            This is an approximate estimate. Actual EMI may vary based on final approval.
          </p>
        </div>
      </div>

      {/* Next Steps Timeline */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Application Timeline</h3>

        <div className="space-y-4">
          {[
            {
              step: 1,
              title: "Document Review",
              time: "1-2 hours",
              desc: "We review your submitted documents",
            },
            {
              step: 2,
              title: "Eligibility Check",
              time: "24 hours",
              desc: "Bank conducts background verification",
            },
            {
              step: 3,
              title: "Offer Generation",
              time: "48 hours",
              desc: "Receive personalized loan offer",
            },
            {
              step: 4,
              title: "Sanction Letter",
              time: "72 hours",
              desc: "Get formal approval and disbursal date",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                  {item.step}
                </div>
                {item.step < 4 && <div className="w-0.5 h-12 bg-purple-300 mt-1" />}
              </div>
              <div className="pb-4">
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
                <p className="text-xs text-purple-600 font-medium mt-1">
                  ~{item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Options */}
      <div className="space-y-4">
        <button
          onClick={handleStartApplication}
          className="w-full px-6 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Start Your Application Now →
        </button>

        <button
          onClick={handleContactExpert}
          className="w-full px-6 py-4 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
        >
          📞 Speak with Our Loan Expert
        </button>
      </div>

      {/* Final Notes */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ <strong>Pre-approved Offer:</strong> Your profile qualifies for
          this loan. Approval is subject to document verification.
        </p>
      </div>
    </div>
  );
}
