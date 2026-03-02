"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { authApi } from "@/lib/api";


export default function UserDetailsPage() {
    const { user, token, refreshUser } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            const hasAll = user.firstName && user.lastName && user.phoneNumber && user.dateOfBirth;
            if (hasAll) {
                // already completed; redirect somewhere sensible
                router.replace("/dashboard");
                return;
            }

            setForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || "",
                dateOfBirth: user.dateOfBirth || "",
            });
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;
        setSaving(true);
        setError(null);

        try {
            await authApi.updateDetails(user.email, {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                dateOfBirth: form.dateOfBirth,
            });
            await refreshUser();
            setSuccess(true);
            // brief delay so user sees the success message
            setTimeout(() => {
                router.replace("/dashboard");
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="pt-32 pb-16 px-6">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl p-8 shadow-xl shadow-black/[0.03] border border-gray-100">
                        <h1 className="text-2xl font-bold font-display mb-1.5 tracking-tight text-gray-900">
                            Complete Your Profile
                        </h1>
                        <p className="text-gray-500 text-[13px] mb-8 font-normal">Please provide your details to continue</p>
                        
                        {error && (
                            <div className="mb-6 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl text-green-600 text-xs font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                Profile completed successfully!
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        value={form.firstName}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, firstName: e.target.value }))
                                        }
                                        required
                                        maxLength={30}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        value={form.lastName}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, lastName: e.target.value }))
                                        }
                                        required
                                        maxLength={30}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={form.phoneNumber}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                                    }
                                    required
                                    pattern={"[0-9+\\s\\-()]*"}
                                    inputMode="numeric"
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                                    Date of Birth
                                </label>
                                <input
                                    type="text"
                                    placeholder="DD-MM-YYYY"
                                    value={form.dateOfBirth}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, dateOfBirth: e.target.value }))
                                    }
                                    required
                                    pattern={"^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\\d{4}$"}
                                    title="Please enter date in DD-MM-YYYY format (e.g., 15-01-1990)"
                                    maxLength={10}
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3.5 bg-[#6605c7] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-[#5a04b1] active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-[#6605c7]/20 mt-4"
                            >
                                {saving ? "Updating..." : "Complete Profile"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
