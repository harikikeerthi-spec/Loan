import { format, isValid } from "date-fns";

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
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
  } catch (error) {
    console.error("formatDate error:", error);
    return fallback;
  }
};
