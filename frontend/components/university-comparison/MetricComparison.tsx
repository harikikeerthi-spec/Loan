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

interface MetricComparisonProps {
  universities: University[];
}

const detailedMetrics = [
  {
    title: "Cost Analysis",
    metrics: [
      {
        label: "Annual Tuition",
        key: "tuition",
        unit: "$",
        format: (val?: number) => (val ? val.toLocaleString() : "N/A"),
      },
      {
        label: "Scholarships Available",
        key: "scholarships",
        unit: "$",
        format: (val?: number) =>
          val ? (val / 1000000).toFixed(1) + "M" : "N/A",
      },
    ],
  },
  {
    title: "Academic Profile",
    metrics: [
      {
        label: "World Rank",
        key: "rank",
        unit: "#",
        format: (val?: number) => (val ? val.toString() : "N/A"),
      },
      {
        label: "Acceptance Rate",
        key: "accept",
        unit: "%",
        format: (val?: number) => (val ? val.toString() : "N/A"),
      },
    ],
  },
  {
    title: "Career Outcomes",
    metrics: [
      {
        label: "Avg Starting Salary",
        key: "avgjobSalary",
        unit: "$",
        format: (val?: number) => (val ? (val / 1000).toFixed(0) + "k" : "N/A"),
      },
      {
        label: "Employment Rate",
        key: "employment",
        unit: "%",
        format: (val?: number) => (val ? val.toString() : "N/A"),
      },
    ],
  },
];

export default function MetricComparison({
  universities,
}: MetricComparisonProps) {
  const getMaxValue = (key: string) => {
    return Math.max(
      ...universities.map((u) => (u[key as keyof University] as number) || 0)
    );
  };

  const getPercentage = (value?: number, max?: number) => {
    if (!value || !max) return 0;
    return (value / max) * 100;
  };

  return (
    <div className="space-y-8">
      {detailedMetrics.map((section) => (
        <div
          key={section.title}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>

          {section.metrics.map((metric) => {
            const maxValue = getMaxValue(metric.key);
            return (
              <div key={metric.key} className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">
                  {metric.label}
                </p>

                <div className="space-y-3">
                  {universities.map((uni) => {
                    const value = uni[metric.key as keyof University] as
                      | number
                      | undefined;
                    const percentage = getPercentage(value, maxValue);
                    const isMaxValue = value === maxValue;

                    return (
                      <div key={uni.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {uni.name}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              isMaxValue
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {metric.format(value)} {metric.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isMaxValue
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Top Recruiters Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Top Recruiters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((uni) => (
            <div key={uni.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">{uni.name}</p>
              {uni.topRecruiters && uni.topRecruiters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {uni.topRecruiters.map((recruiter, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {recruiter}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No recruiters listed</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export and Save */}
      <div className="flex gap-3 justify-end">
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          📊 Export Detailed Report
        </button>
      </div>
    </div>
  );
}
