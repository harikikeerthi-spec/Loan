"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DigilockerCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Processing verification...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code || !state) {
            setError("FRONTEND_MISSING_PARAMS: DigiLocker did not return the required code/state.");
            return;
        }

        const verify = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const redirectUri = window.location.origin + window.location.pathname;

                // FIX: Use the correct backend endpoint path
                const response = await fetch(`/api/digilocker/callback?code=${code}&state=${state}&redirectUri=${encodeURIComponent(redirectUri)}`, {
                    method: 'GET',
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                });

                const result = await response.json();

                if (result.success) {
                    setStatus("Verification successful! Redirecting...");
                    setTimeout(() => {
                        router.push("/document-vault");
                    }, 2000);
                } else {
                    setError(result.message || "Verification failed.");
                }
            } catch (e) {
                console.error(e);
                setError("An error occurred during verification.");
            }
        };

        verify();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center">
                <div className="mb-8 flex justify-center">
                    <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker" className="h-12 w-auto" />
                </div>

                {error ? (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <span className="material-symbols-outlined text-3xl">error</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                        <p className="text-gray-500 text-sm mb-8">{error}</p>
                        <button
                            onClick={() => router.push("/document-vault")}
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all"
                        >
                            Back to Vault
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">{status}</h1>
                        <p className="text-gray-500 text-sm">Please do not close this window.</p>
                    </>
                )}
            </div>
        </div>
    );
}
