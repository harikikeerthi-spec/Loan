"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

// ─── STATUS BADGE ──────────────────────────────────────────────────────
interface StatusBadgeProps {
    status: "pending" | "processing" | "under_review" | "approved" | "rejected" | "disbursed" | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const normStatus = (status || "").toLowerCase().replace(/_/g, " ");
    
    let dotColor = "bg-gray-400";
    let styleObj: React.CSSProperties = {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        borderRadius: "9999px"
    };

    if (normStatus === "pending" || normStatus === "submitted" || normStatus === "submitted to bank") {
        styleObj.backgroundColor = "#E0F2FE";
        styleObj.color = "#0369A1";
        dotColor = "bg-[#0369A1]";
    } else if (normStatus === "under bank review" || normStatus === "under_bank_review" || normStatus === "file logged" || normStatus === "file_logged") {
        styleObj.backgroundColor = "#FEF3C7";
        styleObj.color = "#B45309";
        dotColor = "bg-[#B45309]";
    } else if (normStatus === "processing" || normStatus === "under review" || normStatus === "query raised" || normStatus === "query_raised") {
        styleObj.backgroundColor = "#E0E7FF";
        styleObj.color = "#4F46E5";
        dotColor = "bg-[#4F46E5] animate-pulse";
    } else if (normStatus === "approved" || normStatus === "sanctioned" || normStatus === "verified") {
        styleObj.backgroundColor = "#D1FAE5";
        styleObj.color = "#065F46";
        dotColor = "bg-[#065F46]";
    } else if (normStatus === "rejected" || normStatus === "cancelled") {
        styleObj.backgroundColor = "#FEE2E2";
        styleObj.color = "#991B1B";
        dotColor = "bg-[#991B1B]";
    } else if (normStatus === "disbursed" || normStatus === "paid out" || normStatus === "disbursement confirmed" || normStatus === "disbursement_confirmed") {
        styleObj.backgroundColor = "#F3E8FF";
        styleObj.color = "#6B21A8";
        dotColor = "bg-[#6B21A8]";
    } else {
        styleObj.backgroundColor = "#F3F4F6";
        styleObj.color = "#4B5563";
        dotColor = "bg-[#4B5563]";
    }

    return (
        <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider select-none border border-transparent"
            style={styleObj}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            {normStatus}
        </span>
    );
}

// ─── PRIORITY TAG ───────────────────────────────────────────────────────
interface PriorityTagProps {
    priority: "high" | "medium" | "low" | string;
}

export function PriorityTag({ priority }: PriorityTagProps) {
    const norm = (priority || "").toLowerCase();
    
    let styles = "bg-slate-50 text-slate-600 border-slate-200";
    if (norm === "high") {
        styles = "bg-rose-50 text-rose-600 border-rose-200/80 font-black animate-pulse";
    } else if (norm === "medium") {
        styles = "bg-amber-50 text-amber-600 border-amber-200/80 font-extrabold";
    } else if (norm === "low") {
        styles = "bg-emerald-50 text-emerald-600 border-emerald-200/80 font-semibold";
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 border rounded-lg text-[9px] uppercase tracking-widest ${styles}`}>
            {norm || "normal"}
        </span>
    );
}

// ─── DATA TABLE ──────────────────────────────────────────────────────────
export interface ColumnDef<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
    sortable?: boolean;
    align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    defaultSortKey?: string;
    defaultSortDirection?: "asc" | "desc";
}

export function DataTable<T>({
    data,
    columns,
    emptyMessage = "No records found.",
    onRowClick,
    defaultSortKey,
    defaultSortDirection = "desc",
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultSortDirection);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        
        return [...data].sort((a: any, b: any) => {
            let valA = a[sortKey];
            let valB = b[sortKey];

            // Handle date checking
            if (valA instanceof Date) valA = valA.getTime();
            if (valB instanceof Date) valB = valB.getTime();

            // string checks
            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDirection]);

    return (
        <div className="overflow-x-auto w-full no-scrollbar pb-4">
            <div className="min-w-[1000px] flex flex-col gap-4">
                {/* Header Row */}
                <div 
                    className="grid items-center px-6 py-3.5 bg-[#F9FAFB] border-b border-gray-200 rounded-lg"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
                >
                    {columns.map((col, idx) => {
                        const isSortable = col.sortable !== false;
                        const isCurrentSort = sortKey === col.accessorKey;
                        const alignClass = 
                            col.align === "right" 
                                ? "justify-end text-right pr-4" 
                                : col.align === "center" 
                                    ? "justify-center text-center" 
                                    : "justify-start text-left";
                        return (
                            <div
                                key={idx}
                                onClick={() => isSortable && handleSort(col.accessorKey as string)}
                                className={`text-[11px] font-bold uppercase tracking-wider text-gray-500 select-none flex items-center gap-1 group/header ${alignClass} ${
                                    isSortable ? "cursor-pointer hover:text-gray-900" : ""
                                }`}
                            >
                                <span>{col.header}</span>
                                {isSortable && (
                                    <span className={`material-symbols-outlined text-[12px] transition-opacity duration-200 ${
                                        isCurrentSort ? "opacity-100 text-gray-900" : "opacity-0 group-hover/header:opacity-60 text-gray-400"
                                    }`}>
                                        {isCurrentSort
                                            ? sortDirection === "asc"
                                                ? "arrow_upward"
                                                : "arrow_downward"
                                            : "arrow_upward"}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Body Rows as 3D Cards */}
                <div className="flex flex-col gap-3">
                    {sortedData.length === 0 ? (
                        <div className="py-12 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <EmptyState message={emptyMessage} />
                        </div>
                    ) : (
                        sortedData.map((row: any, idx) => (
                            <div
                                key={row.id || idx}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`grid items-center px-6 py-5.5 rounded-lg bg-white border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:border-gray-200 ${
                                    onRowClick ? "cursor-pointer" : ""
                                }`}
                                style={{ 
                                    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {columns.map((col, colIdx) => {
                                    const alignClass = 
                                        col.align === "right" 
                                            ? "text-right pr-4" 
                                            : col.align === "center" 
                                                ? "text-center" 
                                                : "text-left";
                                    return (
                                        <div key={colIdx} className={`text-[13.5px] text-gray-700 pr-2 ${alignClass}`}>
                                            {col.cell ? col.cell(row) : String(row[col.accessorKey] || "—")}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── PAGE HEADER ─────────────────────────────────────────────────────────
interface PageHeaderProps {
    title: string;
    description?: string;
    moduleName?: string;
    icon?: string;
    actionSlot?: React.ReactNode;
}

export function PageHeader({ title, description, moduleName = "Bank Portal", icon = "folder_shared", actionSlot }: PageHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#4F46E5] bg-[#4F46E5]/10 p-2 rounded-lg text-xl">
                        {icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]">
                        {moduleName}
                    </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#0A2540] tracking-tight font-sans">
                    {title}
                </h1>
                {description && (
                    <p className="text-xs text-gray-500 font-medium font-sans">
                        {description}
                    </p>
                )}
            </div>
            {actionSlot && <div className="w-full lg:w-auto">{actionSlot}</div>}
        </div>
    );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────
interface EmptyStateProps {
    title?: string;
    message: string;
    icon?: string;
}

export function EmptyState({ title = "No Data Found", message, icon = "folder_off" }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <span className="material-symbols-outlined text-gray-200 text-6xl mb-4 select-none">
                {icon}
            </span>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1">
                {title}
            </h3>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                {message}
            </p>
        </div>
    );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────
interface SpinnerProps {
    message?: string;
    size?: "sm" | "md" | "lg";
}

export function Spinner({ message = "Establishing secure connection...", size = "md" }: SpinnerProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-14 h-14",
        lg: "w-20 h-20"
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 gap-4">
            <div className="relative">
                <div className={`border-4 border-gray-100 border-t-[#6605c7] rounded-full animate-spin ${sizeClasses[size]}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#6605c7] text-sm animate-pulse">
                        lock
                    </span>
                </div>
            </div>
            {message && (
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 animate-pulse italic">
                    {message}
                </p>
            )}
        </div>
    );
}
