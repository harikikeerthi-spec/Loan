"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already answered the cookie consent
        const hasAnswered = document.cookie.includes("cookie_consent_answered=true");
        if (!hasAnswered) {
            // Add a small delay so it doesn't pop up too aggressively
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptAll = () => {
        // Set all to true
        const prefs = { essential: true, analytical: true, marketing: true };
        localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
        
        document.cookie = "cookie_consent_answered=true; max-age=31536000; path=/";
        document.cookie = "visitor_analytics_id=active; max-age=63072000; path=/";
        document.cookie = "marketing_funnel_state=active; max-age=31536000; path=/";
        
        setIsVisible(false);
    };

    const acceptEssential = () => {
        // Set only essential to true
        const prefs = { essential: true, analytical: false, marketing: false };
        localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
        
        document.cookie = "cookie_consent_answered=true; max-age=31536000; path=/";
        document.cookie = "visitor_analytics_id=; max-age=0; path=/";
        document.cookie = "marketing_funnel_state=; max-age=0; path=/";
        
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
            <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl border border-[#6605c7]/20 rounded-2xl p-5 md:p-6 shadow-2xl pointer-events-auto flex flex-col md:flex-row items-center gap-6 transform transition-all duration-500 ease-out translate-y-0 opacity-100">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-[#6605c7]">cookie</span>
                        <h3 className="text-[16px] font-bold font-display text-gray-900">We Value Your Privacy</h3>
                    </div>
                    <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                        We use cookies to enhance your browsing experience, serve personalized loans, and analyze our traffic. 
                        By clicking "Accept All", you consent to our use of cookies. 
                        <Link href="/cookies" className="text-[#6605c7] hover:underline font-bold ml-1">
                            Read our Cookie Policy
                        </Link>
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    <Link 
                        href="/cookies"
                        onClick={() => setIsVisible(false)}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors text-center"
                    >
                        Customize
                    </Link>
                    <button
                        onClick={acceptEssential}
                        className="px-5 py-2.5 rounded-xl border border-[#6605c7]/20 text-[#6605c7] font-bold text-xs uppercase tracking-wider hover:bg-[#6605c7]/5 transition-colors"
                    >
                        Essential Only
                    </button>
                    <button
                        onClick={acceptAll}
                        className="px-5 py-2.5 rounded-xl bg-[#6605c7] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#8b24e5] transition-colors shadow-lg shadow-purple-500/20"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
}
