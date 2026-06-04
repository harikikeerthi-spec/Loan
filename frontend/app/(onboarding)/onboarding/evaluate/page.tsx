"use client";

import UniversityEvaluatorFlow from "@/components/UniversityEvaluatorFlow";

export default function EvaluatePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <UniversityEvaluatorFlow />
      </div>
    </div>
  );
}
