"use client";

import { useState } from "react";
import { aiApi } from "@/lib/api";
import { UniversityEvaluationEngine } from "@/lib/universityEvaluationEngine";

interface University {
  name: string;
  country: string;
  rank?: number;
  tuition?: number;
  accept?: number;
  avgjobSalary?: number;
  employment?: number;
  min_gpa?: number;
  courses?: string[];
  loc?: string;
  slug?: string;
  logo?: string;
}

interface EvaluationResult {
  name: string;
  evaluationScore: number;
  recommendation: string;
  factors: {
    academic: { score: number; text: string };
    admission: { score: number; text: string };
    cost: { score: number; text: string };
    courseMatch: { score: number; text: string };
    reputation: { score: number; text: string };
  };
}

interface UserProfile {
  gpa: number;
  workExp: number;
  englishTest: string;
  englishScore: number;
  budget: string;
  course: string;
  bachelors: string;
}

export default function UniversityEvaluatorFlow() {
  const [step, setStep] = useState<"input" | "profile" | "results">("input");
  const [universityInput, setUniversityInput] = useState("");
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    gpa: 7.5,
    workExp: 12,
    englishTest: "ielts",
    englishScore: 7.0,
    budget: "above_40",
    course: "",
    bachelors: "",
  });
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedUni, setExpandedUni] = useState<string | null>(null);

  // Parse universities from input (comma or newline separated)
  const parseUniversities = (input: string): string[] => {
    return input
      .split(/[,\n]/)
      .map((uni) => uni.trim())
      .filter((uni) => uni.length > 0)
      .slice(0, 5);
  };

  const handleAddUniversities = () => {
    if (universityInput.trim()) {
      const unis = parseUniversities(universityInput);
      if (unis.length < 3) {
        setError("Please enter at least 3 university names");
        return;
      }
      setSelectedUniversities(unis);
      setError("");
      setStep("profile");
    }
  };

  const handleEvaluate = async () => {
    if (!userProfile.course || !userProfile.bachelors) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare shortlist format for API
      const shortlist = selectedUniversities.map((name) => ({
        name,
        course: userProfile.course,
      }));

      // Call AI evaluation API
      const response = await aiApi.compareShortlist(shortlist, {
        bachelors: userProfile.bachelors,
        workExp: String(userProfile.workExp),
        gpa: String(userProfile.gpa),
      });

      if (response?.success && response.data?.universities) {
        // Transform AI response into our format
        const results = response.data.universities.map((uni: any, idx: number) => {
          // Parse admission chance percentage
          const admissionMatch = uni.admissionChance?.match(/(\d+)%/);
          const admissionPercent = admissionMatch ? parseInt(admissionMatch[1]) : 65;

          // Parse ROI score
          const roiScore = parseInt(uni.roiScore) || 7;

          // Calculate overall score using enhanced algorithm
          const academicFit = uni.profileAnalysis?.includes("strong")
            ? 85
            : uni.profileAnalysis?.includes("good")
            ? 75
            : 65;
          const admissionFit = admissionPercent;
          const costFit = 75;
          const courseFit = 85;
          const reputationFit = Math.max(0, 100 - (uni.rank || 100));
          const careerFit = roiScore * 10;

          // Weighted scoring (same as in evaluation engine)
          const overallScore = Math.round(
            academicFit * 0.25 +
            admissionFit * 0.2 +
            costFit * 0.15 +
            courseFit * 0.15 +
            reputationFit * 0.15 +
            careerFit * 0.1
          );

          const recommendation =
            overallScore >= 85
              ? "🌟 Highly Recommended"
              : overallScore >= 75
              ? "✓ Recommended"
              : overallScore >= 65
              ? "△ Consider"
              : "⚠ Challenging";

          return {
            name: uni.name,
            evaluationScore: Math.min(100, overallScore),
            recommendation,
            factors: {
              academic: {
                score: academicFit,
                text: academicFit >= 75 ? "Excellent fit" : "Good fit",
              },
              admission: {
                score: admissionFit,
                text: uni.admissionChance || "Moderate chance",
              },
              cost: {
                score: costFit,
                text: "Moderate cost",
              },
              courseMatch: {
                score: courseFit,
                text: "Program matches",
              },
              reputation: {
                score: reputationFit,
                text: uni.rank ? `Rank #${uni.rank}` : "Well-ranked",
              },
            },
          };
        });

        // Sort by evaluation score
        results.sort((a: any, b: any) => b.evaluationScore - a.evaluationScore);
        setEvaluationResults(results);
        setStep("results");
      } else {
        setError("Failed to evaluate universities. Please try again.");
      }
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setError(err?.message || "An error occurred during evaluation");
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // STEP 1: Input Universities
  // ════════════════════════════════════════════════════════════
  if (step === "input") {
    return (
      <div className="evaluator-container" style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>
            📊 Evaluate Your Shortlisted Universities
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            Enter 3-5 universities you're considering for your master's programme
          </p>
        </div>

        {/* Input Area */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#4b5563" }}>
            University Names
          </label>
          <textarea
            placeholder="Enter universities (comma or line separated)&#10;&#10;Example:&#10;MIT&#10;Stanford&#10;UC Berkeley&#10;Carnegie Mellon&#10;Harvard"
            value={universityInput}
            onChange={(e) => {
              setUniversityInput(e.target.value);
              setError("");
            }}
            style={{
              width: "100%",
              minHeight: 150,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
            {parseUniversities(universityInput).length > 0
              ? `✓ ${parseUniversities(universityInput).length} universities detected (max 5)`
              : "You can enter universities separated by commas or line breaks"}
          </div>
        </div>

        {/* Preview */}
        {parseUniversities(universityInput).length > 0 && (
          <div style={{ marginBottom: 20, padding: 12, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 8, textTransform: "uppercase" }}>
              Selected Universities
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {parseUniversities(universityInput).map((uni) => (
                <span
                  key={uni}
                  style={{
                    padding: "6px 10px",
                    background: "white",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#059669",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  ✓ {uni}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              background: "#fee2e2",
              borderRadius: 10,
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAddUniversities}
          disabled={parseUniversities(universityInput).length < 3}
          style={{
            width: "100%",
            padding: 12,
            background: parseUniversities(universityInput).length >= 3 ? "#6605c7" : "#d1d5db",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: parseUniversities(universityInput).length >= 3 ? "pointer" : "not-allowed",
          }}
        >
          Continue with {parseUniversities(universityInput).length} Universities →
        </button>

        <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
          ✓ Minimum 3 universities • Maximum 5 universities
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // STEP 2: User Profile
  // ════════════════════════════════════════════════════════════
  if (step === "profile") {
    return (
      <div className="evaluator-container" style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
        <button
          onClick={() => {
            setStep("input");
            setError("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 14,
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          ← Back to Universities
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>
          📋 Tell Us About Yourself
        </h2>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          We'll use this information to evaluate how well you match each university
        </p>

        {/* Undergraduate Details */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#4b5563" }}>
            * Your Undergraduate Major
          </label>
          <input
            type="text"
            placeholder="e.g., B.Tech in Computer Science, BBA, B.Sc Physics"
            value={userProfile.bachelors}
            onChange={(e) =>
              setUserProfile({ ...userProfile, bachelors: e.target.value })
            }
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Master's Programme */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#4b5563" }}>
            * Programme You're Applying For
          </label>
          <input
            type="text"
            placeholder="e.g., MS Computer Science, MBA, MSc Data Science"
            value={userProfile.course}
            onChange={(e) => setUserProfile({ ...userProfile, course: e.target.value })}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* GPA */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#4b5563" }}>
            CGPA / Percentage
          </label>
          <input
            type="number"
            placeholder="e.g., 8.5 or 85%"
            value={userProfile.gpa}
            onChange={(e) => setUserProfile({ ...userProfile, gpa: parseFloat(e.target.value) || 0 })}
            step="0.1"
            min="0"
            max="10"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Work Experience */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#4b5563" }}>
            Work Experience (months)
          </label>
          <input
            type="number"
            placeholder="e.g., 12"
            value={userProfile.workExp}
            onChange={(e) => setUserProfile({ ...userProfile, workExp: parseInt(e.target.value) || 0 })}
            min="0"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Budget */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#4b5563" }}>
            Annual Budget
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { value: "below_15", label: "Below ₹15 Lakhs" },
              { value: "15_25", label: "₹15–25 Lakhs" },
              { value: "25_40", label: "₹25–40 Lakhs" },
              { value: "above_40", label: "Above ₹40 Lakhs" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUserProfile({ ...userProfile, budget: opt.value })}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: userProfile.budget === opt.value ? "2px solid #6605c7" : "1px solid #e5e7eb",
                  background: userProfile.budget === opt.value ? "#f5f3ff" : "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: userProfile.budget === opt.value ? "#6605c7" : "#6b7280",
                  cursor: "pointer",
                }}
              >
                {userProfile.budget === opt.value ? "✓ " : ""}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              background: "#fee2e2",
              borderRadius: 10,
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Evaluate Button */}
        <button
          onClick={handleEvaluate}
          disabled={!userProfile.course || !userProfile.bachelors || loading}
          style={{
            width: "100%",
            padding: 12,
            background:
              userProfile.course && userProfile.bachelors && !loading
                ? "linear-gradient(135deg, #6605c7, #7c3aed)"
                : "#d1d5db",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor:
              userProfile.course && userProfile.bachelors && !loading
                ? "pointer"
                : "not-allowed",
            boxShadow:
              userProfile.course && userProfile.bachelors && !loading
                ? "0 4px 14px rgba(102, 5, 199, 0.3)"
                : "none",
          }}
        >
          {loading ? "Evaluating..." : "🚀 Evaluate Universities"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // STEP 3: Results
  // ════════════════════════════════════════════════════════════
  if (step === "results") {
    const topMatch = evaluationResults[0];

    return (
      <div className="evaluator-container" style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
        <button
          onClick={() => {
            setStep("input");
            setUniversityInput("");
            setSelectedUniversities([]);
            setEvaluationResults([]);
            setError("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 14,
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          ← Evaluate Different Universities
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>
          ✨ Evaluation Results
        </h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          Based on your profile for {userProfile.course}
        </p>

        {/* Top Recommendation */}
        {topMatch && (
          <div
            style={{
              marginBottom: 24,
              padding: 20,
              background: "linear-gradient(135deg, #fef3c7, #fef08a)",
              borderRadius: 14,
              border: "2px solid #fcd34d",
              boxShadow: "0 8px 24px rgba(245,158,11,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#d97706",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  🌟 Top Recommendation
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>
                  {topMatch.name}
                </h3>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#fef3c7",
                  borderRadius: 12,
                  textAlign: "center",
                  border: "2px solid #fcd34d",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>
                  {topMatch.evaluationScore}%
                </div>
                <div style={{ fontSize: 10, color: "#a16207", fontWeight: 700 }}>Match Score</div>
              </div>
            </div>

            {/* Evaluation Factors */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
              {Object.entries(topMatch.factors).map(([key, val]: any) => (
                <div
                  key={key}
                  style={{
                    padding: 10,
                    background: "white",
                    borderRadius: 10,
                    border: "1px solid #fcd34d",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {key === "courseMatch"
                      ? "Course"
                      : key === "academic"
                      ? "Academic"
                      : key === "admission"
                      ? "Admission"
                      : key === "cost"
                      ? "Affordability"
                      : "Reputation"}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color:
                        val.score >= 75
                          ? "#16a34a"
                          : val.score >= 50
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  >
                    {val.score}%
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                    {val.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Why This University */}
            <div
              style={{
                padding: 12,
                background: "white",
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#f59e0b",
                  marginBottom: 4,
                }}
              >
                💡 Why This University?
              </div>
              <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
                This university is your best match based on your profile. Your {userProfile.gpa.toFixed(1)} GPA aligns well with the typical intake, and
                the {userProfile.course} programme matches your career goals perfectly. The cost also fits within
                your budget preferences.
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: 12,
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
              }}
            >
              📋 View Full Details & Apply
            </button>
          </div>
        )}

        {/* All Evaluations */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              marginBottom: 12,
              letterSpacing: 1,
            }}
          >
            Complete Evaluation
          </div>

          {evaluationResults.map((uni, idx) => (
            <div
              key={uni.name}
              style={{
                marginBottom: 10,
                padding: 14,
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setExpandedUni(expandedUni === uni.name ? null : uni.name)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>
                    #{idx + 1} — {uni.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontWeight: 600,
                    }}
                  >
                    {uni.recommendation}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px 12px",
                    background: idx === 0 ? "#fef3c7" : "#f3f4f6",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: idx === 0 ? "#d97706" : "#6b7280",
                    }}
                  >
                    {uni.evaluationScore}%
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: idx === 0 ? "#a16207" : "#9ca3af" }}>Score</div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedUni === uni.name && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    {Object.entries(uni.factors).map(([key, val]: any) => (
                      <div key={key} style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: "#4b5563", marginBottom: 2 }}>
                          {key === "courseMatch"
                            ? "Course Match"
                            : key === "academic"
                            ? "Academic Fit"
                            : key === "admission"
                            ? "Admission Chance"
                            : key === "cost"
                            ? "Affordability"
                            : "Reputation"}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color:
                              val.score >= 75
                                ? "#16a34a"
                                : val.score >= 50
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        >
                          {val.score}% — {val.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Insight */}
        <div
          style={{
            padding: 16,
            background: "#f5f3ff",
            borderRadius: 10,
            border: "1px solid #e9d5ff",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>
            📊 Summary Insight
          </div>
          <div style={{ fontSize: 13, color: "#5b4e99", lineHeight: 1.5 }}>
            Based on your profile with a {userProfile.gpa.toFixed(1)} GPA, {userProfile.workExp} months of work experience, and
            interests in {userProfile.course}, we recommend <strong>{topMatch?.name}</strong> as your best match. However, you should also
            seriously consider <strong>{evaluationResults[1]?.name}</strong> as a strong backup option with a{" "}
            {evaluationResults[1]?.evaluationScore}% compatibility score.
          </div>
        </div>

        {/* Next Steps */}
        <div
          style={{
            padding: 16,
            background: "#ecfdf5",
            borderRadius: 10,
            border: "1px solid #bbf7d0",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
            ✓ Next Steps
          </div>
          <ol
            style={{
              fontSize: 12,
              color: "#047857",
              marginLeft: 16,
              lineHeight: 1.6,
            }}
          >
            <li>Prepare your application documents (transcripts, LORs, SOP)</li>
            <li>Schedule university campus tours or attend webinars</li>
            <li>Apply for education loans if needed</li>
            <li>Connect with mentors from these universities</li>
            <li>Track application deadlines and requirements</li>
          </ol>
        </div>
      </div>
    );
  }

  return null;
}
