/**
 * Activity Logger Utility
 * Provides a centralized way to log staff dashboard activities
 * with consistent formatting and optional immediate UI updates
 */

import { staffProfileApi } from '@/lib/api';

export interface ActivityLogEntry {
  type: string;
  message: string;
  icon: string;
  color: string;
  details?: Record<string, any>;
}

export const ActivityTypes = {
  NEW: 'new',
  UPDATE: 'update',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  SHARE: 'share',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETED: 'rejected', // Using rejected for deleted items
  LINK: 'link',
  SYNC: 'sync',
} as const;

export const ActivityIcons = {
  NEW: 'person_add',
  UPDATE: 'edit',
  UPLOAD: 'cloud_upload',
  DOWNLOAD: 'download',
  SHARE: 'share',
  APPROVED: 'task_alt',
  REJECTED: 'close',
  DELETED: 'delete',
  LINK: 'link',
  SYNC: 'sync',
} as const;

export const ActivityColors = {
  NEW: 'text-emerald-600 bg-emerald-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  UPLOAD: 'text-purple-600 bg-purple-50',
  DOWNLOAD: 'text-orange-600 bg-orange-50',
  SHARE: 'text-indigo-600 bg-indigo-50',
  APPROVED: 'text-emerald-600 bg-emerald-50',
  REJECTED: 'text-rose-600 bg-rose-50',
  DELETED: 'text-rose-600 bg-rose-50',
  LINK: 'text-indigo-600 bg-indigo-50',
  SYNC: 'text-emerald-600 bg-emerald-50',
} as const;

/**
 * Logger class for activity tracking in staff dashboard
 */
export class ActivityLogger {
  private static instance: ActivityLogger;
  private activityCallbacks: Array<(activity: ActivityLogEntry) => void> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  /**
   * Subscribe to activity updates (for real-time UI updates)
   */
  subscribe(callback: (activity: ActivityLogEntry) => void): () => void {
    this.activityCallbacks.push(callback);
    return () => {
      this.activityCallbacks = this.activityCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of a new activity
   */
  private notifySubscribers(activity: ActivityLogEntry) {
    this.activityCallbacks.forEach(cb => {
      try {
        cb(activity);
      } catch (err) {
        console.error('[ActivityLogger] Subscriber error:', err);
      }
    });
  }

  /**
   * Log a new activity
   */
  async log(entry: ActivityLogEntry): Promise<void> {
    try {
      // Send to backend
      await staffProfileApi.logActivity({
        type: entry.type,
        msg: entry.message,
        icon: entry.icon,
        color: entry.color
      }).catch(console.error);

      // Notify subscribers for UI updates
      this.notifySubscribers(entry);
    } catch (err) {
      console.error('[ActivityLogger] Failed to log activity:', err);
    }
  }

  /**
   * Log profile creation
   */
  async logProfileCreation(
    firstName: string,
    lastName: string,
    bank?: string
  ): Promise<void> {
    const message = bank
      ? `Created staff profile for ${firstName} ${lastName} for ${bank}`
      : `Created staff profile for ${firstName} ${lastName}`;

    await this.log({
      type: ActivityTypes.NEW,
      message,
      icon: ActivityIcons.NEW,
      color: ActivityColors.NEW,
      details: { userName: `${firstName} ${lastName}`, bank }
    });
  }

  /**
   * Log document upload
   */
  async logDocumentUpload(
    docType: string,
    userName: string
  ): Promise<void> {
    await this.log({
      type: ActivityTypes.UPLOAD,
      message: `Uploaded ${docType.replace(/_/g, ' ')} for ${userName}`,
      icon: ActivityIcons.UPLOAD,
      color: ActivityColors.UPLOAD,
      details: { docType, userName }
    });
  }

  /**
   * Log document deletion/removal
   */
  async logDocumentRemoval(
    docType: string,
    userName: string
  ): Promise<void> {
    await this.log({
      type: ActivityTypes.DELETED,
      message: `Removed ${docType.replace(/_/g, ' ')} for ${userName}`,
      icon: ActivityIcons.DELETED,
      color: ActivityColors.DELETED,
      details: { docType, userName }
    });
  }

  /**
   * Log share with bank
   */
  async logShareWithBank(
    docCount: number,
    bankName: string,
    bankEmail: string
  ): Promise<void> {
    await this.log({
      type: ActivityTypes.SHARE,
      message: `Shared ${docCount} document(s) with ${bankName} (${bankEmail})`,
      icon: ActivityIcons.SHARE,
      color: ActivityColors.SHARE,
      details: { docCount, bankName, bankEmail }
    });
  }

  /**
   * Log document status update
   */
  async logDocumentStatusUpdate(
    docType: string,
    status: string,
    userName: string
  ): Promise<void> {
    const activityType = status === 'approved' 
      ? ActivityTypes.APPROVED 
      : status === 'rejected'
      ? ActivityTypes.REJECTED
      : ActivityTypes.UPDATE;

    const icon = status === 'approved'
      ? ActivityIcons.APPROVED
      : status === 'rejected'
      ? ActivityIcons.REJECTED
      : ActivityIcons.UPDATE;

    const color = status === 'approved'
      ? ActivityColors.APPROVED
      : status === 'rejected'
      ? ActivityColors.REJECTED
      : ActivityColors.UPDATE;

    await this.log({
      type: activityType,
      message: `Updated ${docType.replace(/_/g, ' ')} status to ${status} for ${userName}`,
      icon,
      color,
      details: { docType, status, userName }
    });
  }

  /**
   * Log application status change
   */
  async logApplicationStatusChange(
    appId: string,
    status: string,
    userName?: string
  ): Promise<void> {
    const activityType = status === 'approved'
      ? ActivityTypes.APPROVED
      : status === 'rejected'
      ? ActivityTypes.REJECTED
      : ActivityTypes.UPDATE;

    const icon = status === 'approved'
      ? ActivityIcons.APPROVED
      : status === 'rejected'
      ? ActivityIcons.REJECTED
      : ActivityIcons.UPDATE;

    const color = status === 'approved'
      ? ActivityColors.APPROVED
      : status === 'rejected'
      ? ActivityColors.REJECTED
      : ActivityColors.UPDATE;

    await this.log({
      type: activityType,
      message: `Moved Application #${appId.slice(-6).toUpperCase()} to ${status}` + (userName ? ` for ${userName}` : ''),
      icon,
      color,
      details: { appId, status, userName }
    });
  }

  /**
   * Log user registration
   */
  async logUserRegistration(
    firstName: string,
    lastName: string
  ): Promise<void> {
    await this.log({
      type: ActivityTypes.NEW,
      message: `Registered new student: ${firstName} ${lastName}`,
      icon: ActivityIcons.NEW,
      color: ActivityColors.NEW,
      details: { firstName, lastName }
    });
  }

  /**
   * Log data sync
   */
  async logDataSync(
    itemName: string,
    details?: string
  ): Promise<void> {
    const message = details
      ? `Synced ${itemName} - ${details}`
      : `Synced ${itemName}`;

    await this.log({
      type: ActivityTypes.SYNC,
      message,
      icon: ActivityIcons.SYNC,
      color: ActivityColors.SYNC,
      details: { itemName }
    });
  }

  /**
   * Log user link
   */
  async logUserLink(
    firstName: string,
    lastName: string
  ): Promise<void> {
    await this.log({
      type: ActivityTypes.LINK,
      message: `Linked existing student: ${firstName} ${lastName}`,
      icon: ActivityIcons.LINK,
      color: ActivityColors.LINK,
      details: { firstName, lastName }
    });
  }

  /**
   * Log custom activity
   */
  async logCustom(
    type: string,
    message: string,
    icon: string,
    color: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      type,
      message,
      icon,
      color,
      details
    });
  }
}

/**
 * Export singleton instance for easy access
 */
export const activityLogger = ActivityLogger.getInstance();

export default ActivityLogger;
