"use client";

import { useState, useEffect } from "react";
import EligibilityStep from "./loan-assistant/EligibilityStep";
import ProductRecommendation from "./loan-assistant/ProductRecommendation";
import DocumentChecklist from "./loan-assistant/DocumentChecklist";
import NextStepsCard from "./loan-assistant/NextStepsCard";

type Step = "eligibility" | "products" | "emi" | "documents" | "next-steps" | "complete";

type EligibilityData = {
  annualIncome: number | null;
  creditScore: number | null;
  employmentType: string;
  yearsOfEmployment: number | null;
};

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

export default function LoanAssistantFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("eligibility");
  const [eligibilityData, setEligibilityData] = useState<EligibilityData>({
    annualIncome: null,
    creditScore: null,
    employmentType: "",
    yearsOfEmployment: null,
  });
  const [recommendedProducts, setRecommendedProducts] = useState<
    RecommendedProduct[]
  >([]);
  const [selectedLoan, setSelectedLoan] = useState<RecommendedProduct | null>(
    null
  );
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle eligibility completion
  const handleEligibilityComplete = async (data: EligibilityData) => {
    setIsLoading(true);
    setEligibilityData(data);

    // Simulate API call to get loan recommendations
    try {
      // In real scenario, this would call: POST /ai/recommend-loan-products
      const demoProducts: RecommendedProduct[] = [
        {
          bankName: "IDFC First Bank",
          productName: "Digital Education Loan",
          interestRate: "10.5% - 12.5%",
          maxLoanAmount: 5000000,
          processingFee: "1% + GST",
          repaymentPeriod: "15 years",
          matchScore: 95,
          features: [
            "Instant approval",
            "Flexible repayment",
            "No collateral required",
          ],
        },
        {
          bankName: "HDFC Credila",
          productName: "Education Loan",
          interestRate: "10.75% - 12.5%",
          maxLoanAmount: 4500000,
          processingFee: "1% of loan",
          repaymentPeriod: "15 years",
          matchScore: 88,
          features: [
            "Quick disbursal",
            "Accent loan scheme",
            "Co-applicant benefits",
          ],
        },
        {
          bankName: "Auxilo Finserve",
          productName: "Student Loan",
          interestRate: "11.25% - 13.5%",
          maxLoanAmount: 3500000,
          processingFee: "1.5% + GST",
          repaymentPeriod: "12 years",
          matchScore: 82,
          features: [
            "Fast processing",
            "Casual loan category",
            "Educational tie-ups",
          ],
        },
      ];
      setRecommendedProducts(demoProducts);
      setCurrentStep("products");
    } catch (error) {
      console.error("Error fetching loan recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: RecommendedProduct) => {
    setSelectedLoan(product);
    // Simulate moving to documents step (EMI calculator could be integrated)
    setCurrentStep("documents");
  };

  // Handle documents completion
  const handleDocumentsComplete = (documents: string[]) => {
    setSelectedDocuments(documents);
    setCurrentStep("next-steps");
  };

  // Handle final action
  const handleStartApplication = () => {
    setCurrentStep("complete");
    // Redirect or show completion message
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {["Eligibility", "Products", "Documents", "Next Steps"].map(
              (label, idx) => (
                <div
                  key={label}
                  className="flex flex-col items-center flex-1"
                  style={{
                    opacity:
                      currentStep === ["eligibility", "products", "documents", "next-steps"][idx] ||
                      (["eligibility", "products", "documents", "next-steps"].indexOf(currentStep) >
                        idx)
                        ? 1
                        : 0.5,
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                      ["eligibility", "products", "documents", "next-steps"].indexOf(
                        currentStep
                      ) >= idx
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 text-center">
                    {label}
                  </span>
                </div>
              )
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-500"
              style={{
                width: `${
                  (["eligibility", "products", "documents", "next-steps"].indexOf(
                    currentStep
                  ) +
                    1) *
                  25
                }%`,
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {currentStep === "eligibility" && (
            <EligibilityStep
              onComplete={handleEligibilityComplete}
              isLoading={isLoading}
            />
          )}

          {currentStep === "products" && (
            <ProductRecommendation
              products={recommendedProducts}
              onSelect={handleProductSelect}
              isLoading={isLoading}
            />
          )}

          {currentStep === "documents" && (
            <DocumentChecklist
              loanProduct={selectedLoan}
              onComplete={handleDocumentsComplete}
            />
          )}

          {currentStep === "next-steps" && (
            <NextStepsCard
              loanProduct={selectedLoan}
              onStartApplication={handleStartApplication}
            />
          )}

          {currentStep === "complete" && (
            <div className="text-center py-12">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're all set!
              </h2>
              <p className="text-gray-600 mb-6">
                Your loan application has been initiated. Check your email for
                next steps.
              </p>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
