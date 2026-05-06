"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Processing...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const urlStatus = searchParams.get("status");
        const message = searchParams.get("message");

        if (urlStatus === "success") {
            setStatus(message || "Documents fetched successfully! Redirecting...");
            setTimeout(() => router.push("/document-vault"), 2000);
        } else if (urlStatus === "error") {
            setError(message || "Something went wrong.");
        } else {
            // If we land here with code & state, redirect to backend callback
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            if (code && state) {
                setStatus("Completing verification...");
                window.location.href = `/api/digilocker/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
            } else {
                setError("Invalid callback. Missing parameters.");
            }
        }
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

export default function DigilockerCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
