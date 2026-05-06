"use client";

type University = {
  id: string;
  name: string;
  country: string;
  city: string;
  logo?: string;
  rank?: number;
  accept?: number;
  tuition?: number;
  description?: string;
  slug?: string;
  website?: string;
  _score?: number;
  loan?: boolean;
  scholarships?: number;
  avgjobSalary?: number;
  employment?: number;
  topRecruiters?: string[];
};

interface ComparisonGridProps {
  universities: University[];
}

const metrics = [
  {
    label: "World Rank",
    key: "rank",
    format: (val?: number) => (val ? `#${val}` : "N/A"),
  },
  {
    label: "Acceptance Rate",
    key: "accept",
    format: (val?: number) => (val ? `${val}%` : "N/A"),
  },
  {
    label: "Annual Tuition",
    key: "tuition",
    format: (val?: number) => (val ? `$${val.toLocaleString()}` : "N/A"),
  },
  {
    label: "Scholarships Available",
    key: "scholarships",
    format: (val?: number) =>
      val ? `$${(val / 1000000).toFixed(1)}M` : "N/A",
  },
  {
    label: "Avg Starting Salary",
    key: "avgjobSalary",
    format: (val?: number) => (val ? `$${val.toLocaleString()}` : "N/A"),
  },
  {
    label: "Employment Rate",
    key: "employment",
    format: (val?: number) => (val ? `${val}%` : "N/A"),
  },
];

export default function ComparisonGrid({
  universities,
}: ComparisonGridProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 px-6 py-4 text-left bg-gray-50 text-sm font-semibold text-gray-900 z-10">
              Metric
            </th>
            {universities.map((uni) => (
              <th
                key={uni.id}
                className="px-6 py-4 text-center bg-gradient-to-b from-purple-50 to-gray-50"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {uni.name}
                </div>
                <div className="text-xs text-gray-600">
                  {uni.city}, {uni.country}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, idx) => (
            <tr
              key={metric.key}
              className={`border-b border-gray-200 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="sticky left-0 px-6 py-4 text-sm font-medium text-gray-900 bg-inherit z-10">
                {metric.label}
              </td>
              {universities.map((uni) => (
                <td
                  key={uni.id}
                  className="px-6 py-4 text-center text-sm text-gray-900"
                >
                  {metric.format(
                    uni[metric.key as keyof University] as number | undefined
                  )}
                </td>
              ))}
            </tr>
          ))}

          {/* Top Recruiters Row */}
          <tr className="border-b border-gray-200 bg-white">
            <td className="sticky left-0 px-6 py-4 text-sm font-medium text-gray-900 bg-inherit z-10">
              Top Recruiters
            </td>
            {universities.map((uni) => (
              <td
                key={uni.id}
                className="px-6 py-4 text-sm text-gray-700 text-center"
              >
                <div className="flex flex-wrap gap-1 justify-center">
                  {uni.topRecruiters?.[0] && (
                    <>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {uni.topRecruiters[0]}
                      </span>
                      {uni.topRecruiters.length > 1 && (
                        <span className="inline-block px-2 py-1 text-gray-600 text-xs">
                          +{uni.topRecruiters.length - 1} more
                        </span>
                      )}
                    </>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* Loan Ready Row */}
          <tr className="bg-gray-50">
            <td className="sticky left-0 px-6 py-4 text-sm font-medium text-gray-900 bg-inherit z-10">
              Loan Ready
            </td>
            {universities.map((uni) => (
              <td key={uni.id} className="px-6 py-4 text-center">
                {uni.loan ? (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    ✓ Yes
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                    ✗ No
                  </span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Bottom Action */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          📊 Export as PDF
        </button>
        <button className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium">
          💾 Save Comparison
        </button>
      </div>
    </div>
  );
}
