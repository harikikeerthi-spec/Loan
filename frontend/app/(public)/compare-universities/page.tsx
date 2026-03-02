import UniversityComparisonFlow from "@/components/UniversityComparisonFlow";

export const metadata = {
  title: "Compare Universities - Cost, ROI & Career Outcomes | Vidhya Loans",
  description:
    "Side-by-side comparison of universities with detailed metrics: cost, ROI, scholarships, employability, and more.",
};

export default function CompareUniversitiesPage() {
  return (
    <main className="min-h-screen bg-white">
      <UniversityComparisonFlow />
    </main>
  );
}
