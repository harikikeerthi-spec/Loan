import { format, isValid } from "date-fns";

/**
 * Robustly parses a date value as UTC if it lacks a timezone designator.
 */
export const parseUTCDate = (dateVal: any): Date => {
  if (!dateVal) return new Date(NaN);
  if (dateVal instanceof Date) return dateVal;
  
  let str = String(dateVal).trim();
  
  if (/^\d+$/.test(str)) {
    return new Date(Number(str));
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00Z`);
  }
  
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
    str = str.replace(/\s+/, 'T');
  }
  
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    if (!str.endsWith('Z') && !/[-+]\d{2}:?\d{2}$/.test(str)) {
      str = str + 'Z';
    }
  }
  
  return new Date(str);
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
