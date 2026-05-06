"use client";

import { useEffect, useRef, useState } from "react";

/**
 * AnimatedNumber – scroll-triggered count-up animation.
 *
 * Usage:
 *   <AnimatedNumber value="500+" />        → counts 0 → 500, appends "+"
 *   <AnimatedNumber value="₹45L" />        → counts 0 → 45, wraps as "₹{n}L"
 *   <AnimatedNumber value="98%" />          → counts 0 → 98, appends "%"
 *   <AnimatedNumber value={7} />            → counts 0 → 7
 *   <AnimatedNumber value="48hrs" />        → counts 0 → 48, appends "hrs"
 *   <AnimatedNumber value="₹500Cr+" />      → counts 0 → 500, wraps as "₹{n}Cr+"
 */
export default function AnimatedNumber({
    value,
    duration = 2,
    className = "",
}: {
    value: string | number;
    duration?: number;
    className?: string;
}) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [isInView, setIsInView] = useState(false);

    // Parse the numeric part and the prefix/suffix
    const strValue = String(value);
    const match = strValue.match(/^([₹$€]?)([0-9,.]+)(.*)$/);
    const prefix = match ? match[1] : "";
    const numericPart = match ? parseFloat(match[2].replace(/,/g, "")) : 0;
    const suffix = match ? match[3] : "";

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.3 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        if (isInView) {
            setCount(0);
            const end = numericPart;
            if (end === 0) return;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                const linear = Math.min(progress / (duration * 1000), 1);
                // Ease-out cubic for snappy feel
                const eased = 1 - Math.pow(1 - linear, 3);

                setCount(Math.floor(end * eased));

                if (linear < 1) {
                    animationFrame = requestAnimationFrame(animate);
                } else {
                    setCount(end);
                }
            };

            animationFrame = requestAnimationFrame(animate);
        } else {
            setCount(0);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isInView, numericPart, duration]);

    // Format the displayed number
    const displayNum = numericPart >= 1000 ? count.toLocaleString("en-IN") : count;

    return (
        <span ref={ref} className={`tabular-nums ${className}`}>
            {prefix}{displayNum}{suffix}
        </span>
    );
}
