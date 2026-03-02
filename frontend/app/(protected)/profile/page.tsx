"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { authApi } from "@/lib/api";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
    });

    // Keep form in sync whenever the user object updates (e.g. after user-details submission)
    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || "",
                dateOfBirth: user.dateOfBirth || "",
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.email) return;
        setSaving(true);
        try {
            await authApi.updateDetails(user.email, {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                dateOfBirth: form.dateOfBirth,
            });
            await refreshUser();
            setSuccess(true);
            setEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="pt-32 pb-16 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold font-display text-gray-900 mb-8">My Profile</h1>

                    {success && (
                        <div className="mb-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Profile updated successfully!
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Avatar */}
                        <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-[#6605c7] rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#6605c7]/20">
                                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "My Account"}
                                </h2>
                                <p className="text-gray-500 text-sm">{user?.email}</p>
                                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-widest">
                                    {user?.role || "user"}
                                </span>
                            </div>
                        </div>

                        <div className="p-8">
                            {!editing ? (
                                <div className="space-y-4">
                                    {[
                                        { label: "First Name", value: user?.firstName || "—" },
                                        { label: "Last Name", value: user?.lastName || "—" },
                                        { label: "Email", value: user?.email || "—" },
                                        { label: "Phone Number", value: user?.phoneNumber || "—" },
                                        { label: "Date of Birth", value: user?.dateOfBirth || "—" },
                                    ].map((f) => (
                                        <div key={f.label} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{f.label}</span>
                                            <span className="text-[13px] font-semibold text-gray-900">{f.value}</span>
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <button
                                            onClick={() => {
                                                setForm({
                                                    firstName: user?.firstName || "",
                                                    lastName: user?.lastName || "",
                                                    phoneNumber: user?.phoneNumber || "",
                                                    dateOfBirth: user?.dateOfBirth || "",
                                                });
                                                setEditing(true);
                                            }}
                                            className="px-5 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg hover:bg-[#5504a8] transition-all shadow-sm"
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {[
                                        { key: "firstName", label: "First Name" },
                                        { key: "lastName", label: "Last Name" },
                                        { key: "phoneNumber", label: "Phone Number" },
                                        { key: "dateOfBirth", label: "Date of Birth" },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block mb-2">{label}</label>
                                            <input
                                                type={key === "dateOfBirth" ? "date" : "text"}
                                                value={form[key as keyof typeof form]}
                                                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50/50 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] transition-all"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setEditing(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-[#5504a8] transition-all shadow-sm">
                                            {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
}
