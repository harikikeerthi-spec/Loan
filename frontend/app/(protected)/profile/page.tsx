"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ProfilePage() {
    const { user, token, refreshUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phoneNumber: user?.phoneNumber || "",
        dateOfBirth: user?.dateOfBirth || "",
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`${API_URL}/users/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
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
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold font-display dark:text-white mb-8">My Profile</h1>

                    {success && (
                        <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Profile updated successfully!
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        {/* Avatar */}
                        <div className="p-8 bg-gradient-to-r from-[#6605c7] to-purple-700 text-white flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "My Account"}
                                </h2>
                                <p className="text-purple-200">{user?.email}</p>
                                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wide">
                                    {user?.role || "user"}
                                </span>
                            </div>
                        </div>

                        <div className="p-8">
                            {!editing ? (
                                <div className="space-y-6">
                                    {[
                                        { label: "First Name", value: user?.firstName || "—" },
                                        { label: "Last Name", value: user?.lastName || "—" },
                                        { label: "Email", value: user?.email || "—" },
                                        { label: "Phone Number", value: user?.phoneNumber || "—" },
                                        { label: "Date of Birth", value: user?.dateOfBirth || "—" },
                                    ].map((f) => (
                                        <div key={f.label} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700">
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{f.label}</span>
                                            <span className="text-sm font-medium dark:text-white">{f.value}</span>
                                        </div>
                                    ))}
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
                                        className="mt-4 px-6 py-3 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#7a0de8] transition-all"
                                    >
                                        Edit Profile
                                    </button>
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
                                            <label className="text-sm font-bold dark:text-gray-300 block mb-2">{label}</label>
                                            <input
                                                type={key === "dateOfBirth" ? "date" : "text"}
                                                value={form[key as keyof typeof form]}
                                                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6605c7]"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-4">
                                        <button onClick={() => setEditing(false)} className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white font-bold rounded-xl">
                                            Cancel
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#6605c7] text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
                                            {saving && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
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
