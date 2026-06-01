"use client";

import { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, setMonth, setYear, getDaysInMonth, startOfMonth, getDay, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
    value: string; // Expected format: DD-MM-YYYY
    onChange: (date: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
}

export default function DatePicker({ value, onChange, label, placeholder = "Select Date", error, required, disabled }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial value parsing
    useEffect(() => {
        if (value && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
            const [d, m, y] = value.split("-").map(Number);
            setViewDate(new Date(y, m - 1, d));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDateSelect = (day: number) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const formattedDate = format(selectedDate, "dd-MM-yyyy");
        onChange(formattedDate);
        setIsOpen(false);
    };

    const daysInMonth = getDaysInMonth(viewDate);
    const firstDayOfMonth = getDay(startOfMonth(viewDate));
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: (firstDayOfMonth + 6) % 7 }, (_, i) => i); // Adjusted for Monday start if needed, but standard is Sunday. Let's use standard (firstDayOfMonth)

    // Standard Sunday-based grid
    const standardBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const today = new Date();
    const currentYear = today.getFullYear();
    // Loan eligibility: applicant must be 18–40 years old at the time of application
    const MIN_AGE = 18;
    const MAX_AGE = 40;
    // Oldest valid birth date: exactly MAX_AGE years ago
    const maxBirthDate = new Date(today.getFullYear() - MAX_AGE, today.getMonth(), today.getDate());
    // Youngest valid birth date: exactly MIN_AGE years ago
    const minBirthDate = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
    // Year dropdown: only show years within the allowed birth-year window
    const years = Array.from(
        { length: MAX_AGE - MIN_AGE + 1 },
        (_, i) => currentYear - MIN_AGE - i
    );

    const isSelected = (day: number) => {
        if (!value) return false;
        const [d, m, y] = value.split("-").map(Number);
        return y === viewDate.getFullYear() && m === viewDate.getMonth() + 1 && d === day;
    };

    const isToday = (day: number) => {
        return today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth() && today.getDate() === day;
    };

    /** Returns true when a given calendar day falls outside the 18–40 age window */
    const isOutOfRange = (day: number): boolean => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return d > minBirthDate || d < maxBirthDate;
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            {label && (
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1 block">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-between ${
                    isOpen ? "border-[#6605c7] ring-4 ring-[#6605c7]/5 bg-white" : "border-gray-100 hover:border-gray-300"
                } ${error ? "border-red-300" : ""}`}
            >
                <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {value || placeholder}
                </span>
                <span className={`material-symbols-outlined text-gray-400 text-xl transition-transform duration-300 ${isOpen ? "rotate-180 text-[#6605c7]" : ""}`}>
                    calendar_today
                </span>
            </div>

            {error && <p className="text-red-500 text-[10px] font-medium ml-1">{error}</p>}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-[100] left-0 right-0 md:left-auto md:w-80 bg-white rounded-2xl shadow-2xl shadow-gray-200 border border-gray-100 p-5"
                    >
                        {/* Header: Month & Year Selector */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-2">
                                <select 
                                    value={viewDate.getMonth()}
                                    onChange={(e) => setViewDate(setMonth(viewDate, parseInt(e.target.value)))}
                                    className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-gray-900 hover:text-[#6605c7] appearance-none"
                                >
                                    {months.map((m, i) => (
                                        <option key={m} value={i}>{m}</option>
                                    ))}
                                </select>
                                <select 
                                    value={viewDate.getFullYear()}
                                    onChange={(e) => setViewDate(setYear(viewDate, parseInt(e.target.value)))}
                                    className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-gray-900 hover:text-[#6605c7] appearance-none"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setViewDate(subMonths(viewDate, 1))}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                <button 
                                    onClick={() => setViewDate(addMonths(viewDate, 1))}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-tighter py-1">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {standardBlanks.map(i => (
                                <div key={`blank-${i}`} className="h-9" />
                            ))}
                            {days.map(day => {
                                const outOfRange = isOutOfRange(day);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => !outOfRange && handleDateSelect(day)}
                                        disabled={outOfRange}
                                        title={outOfRange ? "Outside eligible age range (18–40 years)" : undefined}
                                        className={`h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                                            outOfRange
                                                ? "text-gray-200 cursor-not-allowed"
                                                : isSelected(day)
                                                ? "bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20"
                                                : isToday(day)
                                                ? "text-[#6605c7] bg-[#6605c7]/5 font-bold"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Age Eligibility Note */}
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="material-symbols-outlined text-amber-500 text-[14px]">info</span>
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                    Eligible age: 18 – 40 years
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-400 font-medium">
                                    Born {maxBirthDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} –&nbsp;
                                    {minBirthDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
