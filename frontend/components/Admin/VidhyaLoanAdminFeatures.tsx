"use client";

import React, { useState } from "react";

/**
 * VidhyaLoan Admin Features Panel
 * Includes features specific to education loan platform
 */
const VidhyaLoanAdminFeatures = () => {
    const [activeFeature, setActiveFeature] = useState<"batch_process" | "eligibility" | "portfolio" | "mentor_mgmt" | "compliance">("batch_process");
    const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);

    return (
        <div className="space-y-6">
            {/* Feature Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {[
                    { id: "batch_process", label: "Batch Processing", icon: "layers" },
                    { id: "eligibility", label: "Eligibility Check", icon: "verified_user" },
                    { id: "portfolio", label: "Portfolio Analysis", icon: "trending_up" },
                    { id: "mentor_mgmt", label: "Mentor Management", icon: "people" },
                    { id: "compliance", label: "Compliance", icon: "policy" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFeature(tab.id as any)}
                        className={`px-4 py-2 rounded-t-lg font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                            activeFeature === tab.id
                                ? "bg-blue-600 text-white border-b-2 border-blue-600"
                                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Batch Processing */}
            {activeFeature === "batch_process" && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">layers</span>
                            Batch Application Processing
                        </h3>
                        <p className="text-sm text-slate-600">Process multiple applications with consistent criteria for faster turnaround</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Applications</p>
                            <p className="text-3xl font-bold text-slate-900">24</p>
                            <p className="text-[10px] text-slate-500 mt-1">Ready for batch processing</p>
                        </div>
                        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">High Priority</p>
                            <p className="text-3xl font-bold text-amber-900">7</p>
                            <p className="text-[10px] text-amber-600 mt-1">Urgent review required</p>
                        </div>
                        <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Can Auto-Approve</p>
                            <p className="text-3xl font-bold text-green-900">12</p>
                            <p className="text-[10px] text-green-600 mt-1">Meet all criteria</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">info</span>
                            Batch Processing Strategies
                        </h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 bg-white rounded border border-blue-100 cursor-pointer hover:bg-blue-50 transition-all">
                                <input type="radio" name="strategy" defaultChecked className="cursor-pointer" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">Auto-Approve Eligible</p>
                                    <p className="text-xs text-slate-600">Applications meeting all criteria auto-approved with standard terms</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-white rounded border border-blue-100 cursor-pointer hover:bg-blue-50 transition-all">
                                <input type="radio" name="strategy" className="cursor-pointer" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">Flag for Review</p>
                                    <p className="text-xs text-slate-600">Batch mark applications for priority review based on criteria</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-white rounded border border-blue-100 cursor-pointer hover:bg-blue-50 transition-all">
                                <input type="radio" name="strategy" className="cursor-pointer" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">Send Requests</p>
                                    <p className="text-xs text-slate-600">Batch request additional documents from applicants</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">start</span>
                        Start Batch Processing
                    </button>
                </div>
            )}

            {/* Eligibility Check */}
            {activeFeature === "eligibility" && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-600">verified_user</span>
                            Eligibility Assessment
                        </h3>
                        <p className="text-sm text-slate-600">Verify education loan eligibility based on VidhyaLoan criteria</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { criteria: "Age between 18-40 years", status: "pass" },
                            { criteria: "Valid admission from recognized institution", status: "pass" },
                            { criteria: "Co-applicant annual income > 3 LPA", status: "pass" },
                            { criteria: "CIBIL score > 650", status: "warning" },
                            { criteria: "No existing defaults/CCJs", status: "pass" },
                            { criteria: "Course duration >= 6 months", status: "pass" },
                            { criteria: "Institution accreditation verified", status: "pass" },
                        ].map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border ${
                                item.status === "pass"
                                    ? "bg-emerald-50 border-emerald-200"
                                    : item.status === "warning"
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-red-50 border-red-200"
                            }`}>
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-[24px] ${
                                        item.status === "pass"
                                            ? "text-emerald-600"
                                            : item.status === "warning"
                                            ? "text-amber-600"
                                            : "text-red-600"
                                    }`}>
                                        {item.status === "pass" ? "check_circle" : item.status === "warning" ? "warning" : "cancel"}
                                    </span>
                                    <p className="font-medium text-slate-900">{item.criteria}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    item.status === "pass"
                                        ? "bg-emerald-200 text-emerald-800"
                                        : item.status === "warning"
                                        ? "bg-amber-200 text-amber-800"
                                        : "bg-red-200 text-red-800"
                                }`}>
                                    {item.status === "pass" ? "✓ Pass" : item.status === "warning" ? "⚠ Check" : "✗ Fail"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-bold text-green-900">✓ Applicant is ELIGIBLE for VidhyaLoan education loan</p>
                        <p className="text-xs text-green-700 mt-1">Recommended loan amount: ₹25,00,000 | Maximum tenure: 15 years</p>
                    </div>
                </div>
            )}

            {/* Portfolio Analysis */}
            {activeFeature === "portfolio" && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-600">trending_up</span>
                            Portfolio Analysis
                        </h3>
                        <p className="text-sm text-slate-600">Analyze loan portfolio health and performance metrics</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Portfolio Value</p>
                            <p className="text-2xl font-bold text-blue-900">₹145 Cr</p>
                            <p className="text-[10px] text-blue-700 mt-1">Across 2,400+ applicants</p>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Approval Rate</p>
                            <p className="text-2xl font-bold text-emerald-900">68%</p>
                            <p className="text-[10px] text-emerald-700 mt-1">↑ 5% from last month</p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Default Rate</p>
                            <p className="text-2xl font-bold text-amber-900">1.2%</p>
                            <p className="text-[10px] text-amber-700 mt-1">↓ Healthy portfolio</p>
                        </div>
                        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg Loan Size</p>
                            <p className="text-2xl font-bold text-purple-900">₹58L</p>
                            <p className="text-[10px] text-purple-700 mt-1">Stable across segments</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900">Top Universities by Applications</h4>
                        {[
                            { name: "University of Toronto", count: 234, approvalRate: 72 },
                            { name: "University of Melbourne", count: 189, approvalRate: 65 },
                            { name: "Imperial College London", count: 156, approvalRate: 71 },
                            { name: "NUS Singapore", count: 142, approvalRate: 68 },
                            { name: "University of Sydney", count: 128, approvalRate: 74 },
                        ].map((uni, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <p className="font-semibold text-slate-900">{uni.name}</p>
                                    <p className="text-xs text-slate-600">{uni.count} applications</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">{uni.approvalRate}%</p>
                                    <p className="text-xs text-slate-600">approval rate</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mentor Management */}
            {activeFeature === "mentor_mgmt" && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">people</span>
                            Mentor & Counselor Management
                        </h3>
                        <p className="text-sm text-slate-600">Manage mentors and counselors assignment to ensure student support</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Mentors</p>
                            <p className="text-3xl font-bold text-slate-900">18</p>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Counselors</p>
                            <p className="text-3xl font-bold text-slate-900">24</p>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unassigned Applications</p>
                            <p className="text-3xl font-bold text-amber-600">12</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900">Top Performing Mentors</h4>
                        {[
                            { name: "Dr. Raj Kumar", specialty: "Education Specialist", mentees: 45, rating: 4.9 },
                            { name: "Prof. Sarah Johnson", specialty: "Career Coach", mentees: 38, rating: 4.8 },
                            { name: "Ms. Priya Singh", specialty: "Visa Expert", mentees: 52, rating: 4.9 },
                        ].map((mentor, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <p className="font-semibold text-slate-900">{mentor.name}</p>
                                    <p className="text-xs text-slate-600">{mentor.specialty} • {mentor.mentees} mentees</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-amber-600">★ {mentor.rating}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">person_add</span>
                        Onboard New Mentor/Counselor
                    </button>
                </div>
            )}

            {/* Compliance */}
            {activeFeature === "compliance" && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-600">policy</span>
                            Compliance & Regulations
                        </h3>
                        <p className="text-sm text-slate-600">Ensure all applications meet regulatory requirements</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            {
                                regulation: "RBI Education Loan Guidelines",
                                status: "compliant",
                                detail: "All applications processed per RBI regulations",
                            },
                            {
                                regulation: "NHB Mortgage Loan Guidelines",
                                status: "compliant",
                                detail: "Collateral evaluation meets NHB standards",
                            },
                            {
                                regulation: "Data Protection (Privacy Policy)",
                                status: "compliant",
                                detail: "100% data encryption and secure storage",
                            },
                            {
                                regulation: "GST Compliance",
                                status: "warning",
                                detail: "3 applications pending GST documentation",
                            },
                            {
                                regulation: "KYC/AML Requirements",
                                status: "compliant",
                                detail: "All applicants verified through DigiLocker",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border-l-4 ${
                                    item.status === "compliant"
                                        ? "bg-emerald-50 border-l-emerald-500 border border-emerald-200"
                                        : "bg-amber-50 border-l-amber-500 border border-amber-200"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-900">{item.regulation}</p>
                                        <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ml-4 ${
                                            item.status === "compliant"
                                                ? "bg-emerald-200 text-emerald-800"
                                                : "bg-amber-200 text-amber-800"
                                        }`}
                                    >
                                        {item.status === "compliant" ? "✓ Compliant" : "⚠ Review"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-bold text-green-900">✓ Overall Compliance: 98%</p>
                        <p className="text-xs text-green-700 mt-1">All major regulations met. Minor documentation issues on 3 applications.</p>
                    </div>

                    <button className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">get_app</span>
                        Generate Compliance Report
                    </button>
                </div>
            )}
        </div>
    );
};

export default VidhyaLoanAdminFeatures;
