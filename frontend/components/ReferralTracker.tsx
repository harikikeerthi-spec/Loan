"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { referralApi } from "@/lib/api";

function TrackerContent() {
    const searchParams = useSearchParams();
    const ref = searchParams.get("ref");

    useEffect(() => {
        if (ref) {
            // Store in localStorage for signup
            localStorage.setItem("referralCode", ref);
            
            // Record visit to backend
            referralApi.recordVisit(ref).catch(err => {
                console.error("Failed to record referral visit:", err);
            });
            
            // Optional: clean up URL or just keep it
        }
    }, [ref]);

    return null;
}

export default function ReferralTracker() {
    return (
        <Suspense fallback={null}>
            <TrackerContent />
        </Suspense>
    );
}
