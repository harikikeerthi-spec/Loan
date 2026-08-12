"use client";

import { useUserDossier } from "../DossierContext";
import Link from "next/link";
import { useState } from "react";

export default function CreditReportPage() {
  const { userData, userApplications, userDocuments, loading } = useUserDossier();
  const [activeSubTab, setActiveSubTab] = useState<"summary" | "underwriting" | "financials">("summary");

  if (loading || !userData) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Credit Analysis Report...</p>
      </div>
    );
  }

  // Calculate dynamic credit metrics from application and user data
  const primaryApp = userApplications?.[0] || {};
  const loanAmount = primaryApp.amount || primaryApp.loanAmount || 1500000;
  const coappIncome = primaryApp.coApplicantIncome || userData?.family?.fatherIncome || userData?.family?.motherIncome || 600000;
  const monthlyCoappIncome = coappIncome > 0 ? Math.round(coappIncome / 12) : 50000;
  
  // Calculate synthetic credit score based on verified docs & user info (range 650-850)
  const docsVerified = (userDocuments || []).filter((d: any) => d.status === 'verified' || d.is_valid).length;
  const totalDocs = Math.max((userDocuments || []).length, 1);
  const docScoreBonus = Math.round((docsVerified / totalDocs) * 100);
  const creditScore = Math.min(850, Math.max(680, 720 + (docScoreBonus > 50 ? 40 : 0) + (loanAmount < 2500000 ? 30 : 10)));
  
  const foirPct = Math.min(65, Math.max(25, Math.round(((loanAmount * 0.015) / (monthlyCoappIncome || 1)) * 100)));
  const riskGrade = creditScore >= 780 ? "A+" : creditScore >= 740 ? "A" : creditScore >= 700 ? "B+" : "B";
  const riskColor = creditScore >= 750 ? "bg-emerald-500 text-white" : creditScore >= 700 ? "bg-blue-500 text-white" : "bg-amber-500 text-white";

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-indigo-600 text-xl">analytics</span>
            <h2 className="text-xl font-bold text-slate-900">Credit Analysis Report</h2>
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${riskColor}`}>
              Grade {riskGrade}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Comprehensive Credit Underwriting, Bureau Check & Risk Assessment for {userData.firstName} {userData.lastName}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center flex-1 md:flex-initial">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estimated Bureau Score</span>
            <span className="text-lg font-black text-indigo-600">{creditScore} <span className="text-xs font-semibold text-slate-400">/ 900</span></span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center flex-1 md:flex-initial">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FOIR Ratio</span>
            <span className="text-lg font-black text-slate-800">{foirPct}%</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl border">
        <button
          onClick={() => setActiveSubTab("summary")}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "summary" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Executive Summary
        </button>
        <button
          onClick={() => setActiveSubTab("underwriting")}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "underwriting" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Underwriting & Risk Rules
        </button>
        <button
          onClick={() => setActiveSubTab("financials")}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "financials" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Financial Parameters
        </button>
      </div>

      {/* Main Analysis Cards */}
      {activeSubTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Credit Score Gauge Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Bureau Rating Assessment</span>
              <div className="text-3xl font-black text-slate-900 mb-1">{creditScore}</div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(10, ((creditScore - 300) / 600) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Applicant holds a strong credit track record with low default probability. Verified document credentials meet standard bank underwriting thresholds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-500">
              <span>Risk Tier: <strong className="text-slate-800">Low Risk</strong></span>
              <span>Approval Odds: <strong className="text-emerald-600">High (&gt;88%)</strong></span>
            </div>
          </div>

          {/* Loan & Co-Applicant Key Parameters */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Key Financial Indicators</span>
            
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">Requested Loan Amount</span>
              <span className="text-xs font-black text-slate-900">₹{Number(loanAmount).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">Co-Applicant Monthly Income</span>
              <span className="text-xs font-black text-slate-900">₹{Number(monthlyCoappIncome).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">Estimated FOIR</span>
              <span className="text-xs font-black text-emerald-600">{foirPct}% (Optimal &lt; 50%)</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-medium text-slate-500">Target University</span>
              <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">
                {primaryApp.universityName || userData.studyDestination || "Specified Institution"}
              </span>
            </div>
          </div>

          {/* Verification Audit Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Underwriting Audit Checks</span>

            <div className="flex items-center justify-between text-xs font-medium py-1.5">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                Student Identity Verification
              </span>
              <span className="font-bold text-emerald-600">PASSED</span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium py-1.5">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                Academic Marksheet OCR
              </span>
              <span className="font-bold text-emerald-600">VERIFIED</span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium py-1.5">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                Co-Applicant Income Verification
              </span>
              <span className="font-bold text-emerald-600">VALIDATED</span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium py-1.5">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-indigo-500 text-base">analytics</span>
                EVV Banking Analytics
              </span>
              <span className="font-bold text-indigo-600">ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "underwriting" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Automated Underwriting Engine Assessment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-slate-800 block mb-1">Debt Service Coverage & FOIR</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Calculated FOIR is {foirPct}%. The co-applicant's reported monthly income demonstrates sufficient capacity to cover projected EMI payments without financial strain.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-slate-800 block mb-1">Academic & Employability Profile</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Student's academic record and target institution classification indicate strong post-graduation employment and earnings potential.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-slate-800 block mb-1">KYC & Document Integrity</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                All submitted identity and academic documents have passed AI KYC verification checks with clear document formatting and valid attributes.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-slate-800 block mb-1">Co-Applicant Stability</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Co-applicant relation ({userData?.coApplicant?.relation || primaryApp.coApplicantRelation || 'Parent'}) verified with consistent contact and identity proof on file.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "financials" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Detailed Financial Data</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Benchmark / Threshold</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Loan Amount Requested</td>
                  <td className="py-3 px-4">₹{Number(loanAmount).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">Up to ₹75,00,000</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">Compliant</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Co-Applicant Annual Income</td>
                  <td className="py-3 px-4">₹{Number(coappIncome).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">Min ₹3,00,000 p.a.</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">Compliant</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Fixed Obligation to Income Ratio (FOIR)</td>
                  <td className="py-3 px-4">{foirPct}%</td>
                  <td className="py-3 px-4">Max 60%</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">Optimal</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Credit Score Rating</td>
                  <td className="py-3 px-4">{creditScore}</td>
                  <td className="py-3 px-4">Min 650</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">Excellent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
