"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAgent } from "../AgentContext";

export default function AgentLeadSubmission() {
    const router = useRouter();
    const {
        leadForm, setLeadForm,
        eligCheck, setEligCheck,
        eligResult, eligLoading,
        csvPreview, csvUploaded, setCsvUploaded, setCsvFile,
        handleLeadSubmit, handleRunEligibility, handleConfirmCSVImport,
        showToast
    } = useAgent();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await handleLeadSubmit(e);
        if (success) {
            router.push("/agent/students");
        }
    };

    const onConfirmCSV = () => {
        handleConfirmCSVImport();
        router.push("/agent/students");
    };

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            {/* Eligibility checker widget */}
            <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <span className="material-symbols-outlined text-[10rem]">verified</span>
                </div>
                
                <div className="relative z-10 max-w-2xl space-y-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Tool Suite</span>
                        <h3 className="text-2xl font-black font-display tracking-tight mt-1">💡 Pre-Submission Eligibility Checker</h3>
                        <p className="text-slate-400 text-xs mt-1">Verify co-applicant requirements and matching banks before completing final leads creation.</p>
                    </div>

                    <form onSubmit={handleRunEligibility} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-slate-400">Course Type</label>
                            <select value={eligCheck.course} onChange={(e) => setEligCheck({ ...eligCheck, course: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none">
                                <option>B.Tech</option>
                                <option>MBBS</option>
                                <option>MBA</option>
                                <option>MS (Abroad)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-slate-400">College / Uni</label>
                            <input type="text" value={eligCheck.college} onChange={(e) => setEligCheck({ ...eligCheck, college: e.target.value })} placeholder="IIT Bombay" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-slate-400">Loan Amount (₹)</label>
                            <input type="number" value={eligCheck.amount} onChange={(e) => setEligCheck({ ...eligCheck, amount: e.target.value })} placeholder="1200000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-slate-400">Co-App Income (₹/yr)</label>
                            <input type="number" value={eligCheck.income} onChange={(e) => setEligCheck({ ...eligCheck, income: e.target.value })} placeholder="600000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none" />
                        </div>
                        <button type="submit" disabled={eligLoading} className="sm:col-span-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2">
                            {eligLoading ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Evaluating...</>
                            ) : "Evaluate Approval Probability"}
                        </button>
                    </form>

                    {eligResult && (
                        <div className={`p-6 rounded-2xl border ${eligResult.color} space-y-2 animate-fade-in`}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm tracking-tight">{eligResult.chance}</h4>
                                {eligResult.score !== undefined && (
                                    <span className="text-xs font-black opacity-70">Score: {eligResult.score}/100</span>
                                )}
                            </div>
                            <p className="text-[11px] opacity-80">{eligResult.details}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                                <span className="font-bold uppercase tracking-wider">Eligible Banks:</span>
                                {eligResult.banks.map((b: string, i: number) => (
                                    <span key={i} className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{b}</span>
                                ))}
                            </div>
                            {eligResult.reasons && eligResult.reasons.length > 0 && (
                                <ul className="text-[10px] opacity-75 pt-1 space-y-0.5">
                                    {eligResult.reasons.map((r: string, i: number) => (
                                        <li key={i}>• {r}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Lead submission choices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Single Lead Form */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">New Student Lead — Single Submit</h3>
                    
                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* STEP 1: STUDENT BASICS */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 1: STUDENT BASICS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">First Name *</label>
                                    <input type="text" required value={leadForm.firstName} onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Last Name *</label>
                                    <input type="text" required value={leadForm.lastName} onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Mobile Number *</label>
                                    <input type="tel" required value={leadForm.phoneNumber} onChange={(e) => setLeadForm({ ...leadForm, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" placeholder="Used for WhatsApp alerts" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Address *</label>
                                    <input type="email" required value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                                    <input type="date" value={leadForm.dob} onChange={(e) => setLeadForm({ ...leadForm, dob: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">City / State</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="City" className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                        <select value={leadForm.state} onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                            <option>Telangana</option>
                                            <option>Andhra Pradesh</option>
                                            <option>Maharashtra</option>
                                            <option>Karnataka</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: LOAN DETAILS */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 2: LOAN DETAILS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Loan Type</label>
                                    <div className="flex gap-4 py-2 text-xs">
                                        <label className="flex items-center gap-2 font-medium cursor-pointer"><input type="radio" name="loanType" checked={leadForm.loanType === "Domestic"} onChange={() => setLeadForm({ ...leadForm, loanType: "Domestic" })} /> Domestic</label>
                                        <label className="flex items-center gap-2 font-medium cursor-pointer"><input type="radio" name="loanType" checked={leadForm.loanType === "Abroad"} onChange={() => setLeadForm({ ...leadForm, loanType: "Abroad" })} /> Abroad</label>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Requested Loan Amount (₹) *</label>
                                    <input type="number" required value={leadForm.amount} onChange={(e) => setLeadForm({ ...leadForm, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Course Name</label>
                                    <input type="text" value={leadForm.courseName} onChange={(e) => setLeadForm({ ...leadForm, courseName: e.target.value })} placeholder="e.g. B.Tech, MBBS, MBA" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">College / University Name</label>
                                    <input type="text" value={leadForm.collegeName} onChange={(e) => setLeadForm({ ...leadForm, collegeName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: CO-APPLICANT (Optional) */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 3: CO-APPLICANT (Optional)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Co-App Name</label>
                                    <input type="text" value={leadForm.coApplicantName} onChange={(e) => setLeadForm({ ...leadForm, coApplicantName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Relationship</label>
                                    <select value={leadForm.coApplicantRelationship} onChange={(e) => setLeadForm({ ...leadForm, coApplicantRelationship: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                        <option>Parent</option>
                                        <option>Spouse</option>
                                        <option>Sibling</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Co-App Mobile</label>
                                    <input type="tel" value={leadForm.coApplicantMobile} onChange={(e) => setLeadForm({ ...leadForm, coApplicantMobile: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* STEP 4: SOURCE & NOTES */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 4: SOURCE & NOTES</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">How did they find you?</label>
                                    <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                        <option>Referral</option>
                                        <option>Walk-in</option>
                                        <option>WhatsApp</option>
                                        <option>College Event</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Internal Notes for Staff</label>
                                    <input type="text" value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" placeholder="e.g. Needs immediate dispatch check" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-50">
                            <button type="submit" className="flex-1 py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Submit Lead</button>
                            <button type="button" onClick={() => showToast("Lead saved as draft successfully.", "info")} className="px-6 py-4 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all border border-gray-100">Save as Draft</button>
                        </div>
                    </form>
                </div>

                {/* Bulk CSV Upload Panel */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Bulk Lead Import</h3>
                            <p className="text-gray-400 text-xs mt-1">Upload list of up to 500 leads instantly via CSV mapping.</p>
                        </div>

                        <button onClick={() => showToast("Template CSV download started.", "success")} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">download</span> Download CSV Template
                        </button>

                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#6605c7]/30 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center min-h-[160px]" onClick={() => setCsvUploaded(true)}>
                            <span className="material-symbols-outlined text-gray-400 text-3xl mb-2">upload_file</span>
                            <span className="text-[11px] font-bold text-gray-700">Choose File or Drop CSV Here</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">max 500 leads per file</span>
                        </div>

                        {csvUploaded && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                                    <span className="font-bold text-emerald-800 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">check_circle</span> 3/3 rows valid</span>
                                    <span className="text-gray-400 text-[10px]">Ready to import</span>
                                </div>
                                <div className="overflow-hidden border border-gray-100 rounded-xl">
                                    <table className="w-full text-left border-collapse text-[10px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500">
                                                <th className="p-2">Name</th>
                                                <th className="p-2">Course</th>
                                                <th className="p-2">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvPreview.map((x, i) => (
                                                <tr key={i} className="border-b border-gray-50 last:border-b-0">
                                                    <td className="p-2 font-bold">{x.name}</td>
                                                    <td className="p-2">{x.course}</td>
                                                    <td className="p-2 font-mono">₹{x.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {csvUploaded && (
                        <div className="flex gap-2 pt-6">
                            <button onClick={onConfirmCSV} className="flex-1 py-3 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Confirm Import</button>
                            <button onClick={() => { setCsvUploaded(false); setCsvFile(null); }} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 transition-all border border-gray-100">Cancel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
