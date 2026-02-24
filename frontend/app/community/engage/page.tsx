"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToDiscussions() {
    const router = useRouter();
    useEffect(() => {
        const params = typeof window !== 'undefined' ? window.location.search : '';
        router.replace(`/community/discussions${params}`);
    }, [router]);
    return null;
}
