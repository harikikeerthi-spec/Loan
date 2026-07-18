export interface ScheduledFollowUpItem {
    id: string;
    appId?: string;
    studentId?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    studentName: string;
    appNumber?: string;
    status?: string;
}

export const DEFAULT_TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

export function formatSlot12Hr(time24: string): string {
    if (!time24) return "";
    const parts = time24.split(":");
    if (parts.length < 2) return time24;
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return time24;
    const mStr = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${mStr} ${ampm}`;
}

/**
 * Retrieves all pending follow-up items scheduled for a staff member across localStorage keys.
 */
export function getAllScheduledFollowUps(staffId: string): ScheduledFollowUpItem[] {
    if (typeof window === "undefined") return [];
    const items: ScheduledFollowUpItem[] = [];

    // 1. Application-level follow ups (staff_follow_up_dates_${staffId})
    const appKey = `staff_follow_up_dates_${staffId}`;
    const appStored = localStorage.getItem(appKey);
    if (appStored) {
        try {
            const parsed = JSON.parse(appStored);
            Object.entries(parsed).forEach(([appId, fu]: [string, any]) => {
                if (fu && fu.date) {
                    items.push({
                        id: appId,
                        appId,
                        date: fu.date,
                        time: fu.time || "10:00",
                        studentName: fu.studentName || "Student",
                        appNumber: fu.appNumber,
                        status: "pending"
                    });
                }
            });
        } catch (e) {
            console.error("Error reading app follow-ups:", e);
        }
    }

    // 2. Student-level follow ups (follow_ups_${staffId}_${studentId})
    const prefix = `follow_ups_${staffId}_`;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            const studentIdFromKey = key.substring(prefix.length);
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((fu: any) => {
                            if (fu && fu.date && (fu.status === "pending" || !fu.status)) {
                                items.push({
                                    id: fu.id,
                                    studentId: fu.studentId || studentIdFromKey,
                                    appId: fu.appId,
                                    date: fu.date,
                                    time: fu.time || "10:00",
                                    studentName: fu.studentName || "Student",
                                    appNumber: fu.appNumber,
                                    status: fu.status || "pending"
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error reading student follow-ups:", e);
                }
            }
        }
    }

    return items;
}

/**
 * Checks if a specific date and time slot is already assigned.
 * Every time slot (Date + Time) can ONLY be assigned once.
 */
export function checkFollowUpConflict(params: {
    staffId: string;
    date: string;
    time: string;
    currentAppId?: string;
    currentStudentId?: string;
    currentFollowUpId?: string;
}): ScheduledFollowUpItem | null {
    const { staffId, date, time, currentAppId, currentFollowUpId } = params;
    if (!date || !time) return null;

    const formattedTime = time.trim();
    const allItems = getAllScheduledFollowUps(staffId);

    const conflict = allItems.find(item => {
        // Skip comparing against the exact same follow-up item being edited
        if (currentFollowUpId && item.id === currentFollowUpId) return false;
        if (currentAppId && item.appId === currentAppId && item.id === currentAppId) return false;

        // Check if exact same date and time slot matches
        const dateMatches = item.date === date;
        const timeMatches = item.time === formattedTime;

        if (dateMatches && timeMatches) {
            return true;
        }

        return false;
    });

    return conflict || null;
}
