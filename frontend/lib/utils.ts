import { format, isValid } from "date-fns";

/**
 * Robustly parses a date value as UTC if it lacks a timezone designator.
 */
export const parseUTCDate = (dateVal: any): Date => {
  if (!dateVal) return new Date(NaN);
  if (dateVal instanceof Date) return dateVal;
  
  let str = String(dateVal).trim();
  if (!str) return new Date(NaN);
  
  if (/^\d+$/.test(str)) {
    return new Date(Number(str));
  }
  
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00Z`);
  }
  
  // Handle space between date and time e.g. "2026-08-06 06:17:08"
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
    str = str.replace(/\s+/, 'T');
  }
  
  // If ISO string without timezone indicator, treat as UTC by appending 'Z'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    if (!/[Zz]$/.test(str) && !/[-+]\d{2}(:?\d{2})?$/.test(str)) {
      str = str + 'Z';
    }
  }
  
  return new Date(str);
};

/**
 * Formats a timestamp into a clean, human-readable date and time string in Asia/Kolkata (IST).
 * Standardized across all note timestamps and activity feeds.
 */
export const formatDateTime = (
  dateVal: any,
  options: {
    month?: "numeric" | "2-digit" | "short" | "long" | "narrow";
    day?: "numeric" | "2-digit";
    year?: "numeric" | "2-digit";
    hour?: "numeric" | "2-digit";
    minute?: "numeric" | "2-digit";
    second?: "numeric" | "2-digit";
    hour12?: boolean;
    timeZone?: string;
    includeSuffixIST?: boolean;
    fallback?: string;
  } = {},
  fallbackStr: string = "—"
): string => {
  const d = parseUTCDate(dateVal);
  if (!isValid(d)) return options.fallback || fallbackStr;

  try {
    const formatted = d.toLocaleString("en-US", {
      timeZone: options.timeZone || "Asia/Kolkata",
      month: options.month || "short",
      day: options.day || "numeric",
      year: options.year || "numeric",
      hour: options.hour || "2-digit",
      minute: options.minute || "2-digit",
      hour12: options.hour12 !== undefined ? options.hour12 : true,
      ...(options.second ? { second: options.second } : {}),
    });
    return options.includeSuffixIST ? `${formatted} IST` : formatted;
  } catch (err) {
    console.error("formatDateTime error:", err);
    return options.fallback || fallbackStr;
  }
};

/**
 * Standard note timestamp formatting function.
 * Displays formatted timestamp in IST (e.g. "Aug 6, 2026, 05:30 PM").
 */
export const formatNoteTime = (dateVal: any, fallbackStr: string = "—"): string => {
  if (!dateVal) return fallbackStr;
  return formatDateTime(
    dateVal,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
    fallbackStr
  );
};

/**
 * Formats a date specifically into IST with optional timezone label.
 */
export const formatIST = (dateVal: any, includeTime: boolean = true): string => {
  const d = parseUTCDate(dateVal);
  if (!isValid(d)) return "—";
  try {
    if (!includeTime) {
      return d.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
};

/**
 * Formats relative time (e.g., "5m ago", "2h ago") with fallback to formatted note time.
 */
export const formatRelativeTime = (dateVal: any): string => {
  const d = parseUTCDate(dateVal);
  if (!isValid(d)) return "Just now";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatNoteTime(dateVal);
};

/**
 * Safely formats a date string or object using date-fns.
 * Returns a fallback string if the date is invalid or missing.
 * 
 * @param date The date to format (string, number, or Date object)
 * @param formatStr The format string to use (default: "MMM d, yyyy")
 * @param fallback The fallback string to return if invalid (default: "—")
 * @returns The formatted date string or fallback
 */
export const formatDate = (
  date: any, 
  formatStr: string = "MMM d, yyyy", 
  fallback: string = "—"
): string => {
  if (!date) return fallback;
  
  try {
    const d = parseUTCDate(date);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
  } catch (error) {
    console.error("formatDate error:", error);
    return fallback;
  }
};

