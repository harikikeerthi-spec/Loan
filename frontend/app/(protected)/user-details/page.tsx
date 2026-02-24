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
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-md mx-auto">
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold font-display mb-8">
                        Complete Your Profile
                    </h1>
                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600">
                            Profile completed successfully! Redirecting...
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4 font-sans">
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
                                    className="w-full px-6 py-4 rounded-full form-input focus:ring-0 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4 font-sans">
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
                                    className="w-full px-6 py-4 rounded-full form-input focus:ring-0 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4 font-sans">
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
                                className="w-full px-6 py-4 rounded-full form-input focus:ring-0 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4 font-sans">
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
                                className="w-full px-6 py-4 rounded-full form-input focus:ring-0 outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-5 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 shadow-2xl transition-all disabled:opacity-60"
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
