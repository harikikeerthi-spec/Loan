"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import PullDocumentsModal from "@/components/staff/PullDocumentsModal";

const StatCard = ({ label, value, icon, color, loading }: any) => (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Metric</span>
        </div>
        <h4 className="text-[32px] font-bold text-slate-900 leading-none mb-1">
            {loading ? <span className="block w-12 h-8 bg-slate-100 animate-pulse rounded" /> : value}
        </h4>
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
);

export default function DocumentTransferPage() {
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [showPullModal, setShowPullModal] = useState(false);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const res: any = await adminApi.getUserStats().catch(() => null);
                if (res && res.success) {
                    setStats({ users: res.data || res });
                } else if (res) {
                    setStats({ users: res });
                }
            } catch (e) {
                console.error("Failed to load user stats", e);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="animate-fade-in max-w-[1400px] mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Document Distribution
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            OPERATIONAL
                        </span>
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1">Direct workflow: Select student → Pull documents → Share with bank</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Active Students" value={stats.users?.student || stats.users?.total || 0} icon="school" color="text-indigo-600" loading={loading} />
                <StatCard label="Documents Pulled" value="0" icon="folder_zip" color="text-purple-600" loading={loading} />
                <StatCard label="Shared with Banks" value="0" icon="account_balance" color="text-emerald-600" loading={loading} />
            </div>

            {/* Main Action Button */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 text-center">
                <div className="mb-4">
                    <span className="text-6xl">📤</span>
                </div>
                <h3 className="text-[20px] font-black text-slate-900 mb-2">
                    Start Pulling & Sharing
                </h3>
                <p className="text-[13px] text-slate-600 mb-6 max-w-[400px] mx-auto">
                    Click below to select a student, pull their documents, and share them directly with a bank in just 3 steps.
                </p>
                <button
                    onClick={() => setShowPullModal(true)}
                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:shadow-xl transition-all flex items-center gap-3 mx-auto shadow-lg"
                >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Open Pull & Share Modal
                </button>
            </div>

            {/* Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
                        <span className="material-symbols-outlined text-indigo-600">person_search</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Select Student</h4>
                    <p className="text-[11px] text-slate-500">Choose the student whose documents you want to pull and share.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">2</div>
                        <span className="material-symbols-outlined text-purple-600">description</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Pull Documents</h4>
                    <p className="text-[11px] text-slate-500">Review and select which documents to share from the student&apos;s profile.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">3</div>
                        <span className="material-symbols-outlined text-emerald-600">business</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Share with Bank</h4>
                    <p className="text-[11px] text-slate-500">Select the target bank and instantly share the documents.</p>
                </div>
            </div>

            <PullDocumentsModal
                isOpen={showPullModal}
                onClose={() => setShowPullModal(false)}
            />
        </div>
    );
}
