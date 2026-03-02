import UniversityFinderFlow from "@/components/UniversityFinderFlow";

export const metadata = {
  title: "Find Your University - Smart Matching | Vidhya Loans",
  description:
    "Find the perfect university based on your academic profile, program interests, and budget. AI-powered university matching and recommendations.",
};

export default function FindUniversityPage() {
  return (
    <main className="min-h-screen bg-white">
      <UniversityFinderFlow />
    </main>
  );
}
