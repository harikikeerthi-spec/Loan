import LoanAssistantFlow from "@/components/LoanAssistantFlow";

export const metadata = {
  title: "Loan Assistant - Guidance & EMI Calculator | Vidhya Loans",
  description: "Get guided assistance for education loan eligibility, product recommendations, EMI calculations, and document requirements.",
};

export default function LoanAssistantPage() {
  return (
    <main className="min-h-screen bg-white">
      <LoanAssistantFlow />
    </main>
  );
}
