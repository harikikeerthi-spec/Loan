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
}

export default function DatePicker({ value, onChange, label, placeholder = "Select Date", error, required }: DatePickerProps) {
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

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    const isSelected = (day: number) => {
        if (!value) return false;
        const [d, m, y] = value.split("-").map(Number);
        return y === viewDate.getFullYear() && m === viewDate.getMonth() + 1 && d === day;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth() && today.getDate() === day;
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            {label && (
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1 block">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm transition-all cursor-pointer flex items-center justify-between ${
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
                            {days.map(day => (
                                <button
                                    key={day}
                                    onClick={() => handleDateSelect(day)}
                                    className={`h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                                        isSelected(day)
                                            ? "bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20"
                                            : isToday(day)
                                            ? "text-[#6605c7] bg-[#6605c7]/5 font-bold"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        {/* Quick Selection Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <button 
                                onClick={() => {
                                    const today = new Date();
                                    setViewDate(today);
                                    handleDateSelect(today.getDate());
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-[#6605c7] hover:underline"
                            >
                                Today
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
