"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

// ─── STATUS BADGE ──────────────────────────────────────────────────────
interface StatusBadgeProps {
    status: "pending" | "processing" | "under_review" | "approved" | "rejected" | "disbursed" | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const normStatus = (status || "").toLowerCase().replace(/_/g, " ");
    
    let styles = "bg-gray-100 text-gray-700 border-gray-200";
    let dotColor = "bg-gray-400";
    
    if (normStatus === "pending" || normStatus === "submitted") {
        styles = "bg-amber-50 text-amber-700 border-amber-200/60 shadow-[0_2px_8px_rgba(245,158,11,0.08)]";
        dotColor = "bg-amber-500";
    } else if (normStatus === "processing" || normStatus === "under review" || normStatus === "under bank review") {
        styles = "bg-blue-50 text-blue-700 border-blue-200/60 shadow-[0_2px_8px_rgba(59,130,246,0.08)]";
        dotColor = "bg-blue-500 animate-pulse";
    } else if (normStatus === "approved" || normStatus === "sanctioned" || normStatus === "verified") {
        styles = "bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-[0_2px_8px_rgba(16,185,129,0.08)]";
        dotColor = "bg-emerald-500";
    } else if (normStatus === "rejected" || normStatus === "cancelled") {
        styles = "bg-rose-50 text-rose-700 border-rose-200/60 shadow-[0_2px_8px_rgba(239,68,68,0.08)]";
        dotColor = "bg-rose-500";
    } else if (normStatus === "disbursed" || normStatus === "paid out") {
        styles = "bg-purple-50 text-purple-700 border-purple-200/60 shadow-[0_2px_8px_rgba(102,5,199,0.08)]";
        dotColor = "bg-purple-500";
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${styles}`}>
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
        <div className="overflow-x-auto w-full no-scrollbar rounded-2xl border border-gray-100 bg-white/40 shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                        {columns.map((col, idx) => {
                            const isSortable = col.sortable !== false;
                            const isCurrentSort = sortKey === col.accessorKey;
                            return (
                                <th
                                    key={idx}
                                    onClick={() => isSortable && handleSort(col.accessorKey as string)}
                                    className={`px-6 py-4 text-[9px] font-black uppercase tracking-[0.25em] text-[#6605c7] select-none ${
                                        isSortable ? "cursor-pointer hover:bg-[#6605c7]/5" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{col.header}</span>
                                        {isSortable && (
                                            <span className="material-symbols-outlined text-[12px] opacity-60">
                                                {isCurrentSort
                                                    ? sortDirection === "asc"
                                                        ? "arrow_upward"
                                                        : "arrow_downward"
                                                    : "unfold_more"}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                    {sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="py-12">
                                <EmptyState message={emptyMessage} />
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row: any, idx) => (
                            <tr
                                key={row.id || idx}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`group transition-all duration-200 ${
                                    onRowClick ? "cursor-pointer hover:bg-[#6605c7]/[0.03]" : "hover:bg-gray-50/40"
                                }`}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4.5 text-xs text-gray-700">
                                        {col.cell ? col.cell(row) : String(row[col.accessorKey] || "—")}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
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
                    <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2 rounded-xl text-xl">
                        {icon}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600">
                        {moduleName}
                    </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-display font-black text-gray-900 tracking-tight italic">
                    {title}
                </h1>
                {description && (
                    <p className="text-xs text-gray-500 font-medium">
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
