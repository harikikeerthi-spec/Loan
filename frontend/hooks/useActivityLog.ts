/**
 * Custom hook for managing real-time activity logs in the staff dashboard
 * Provides methods to log activities and subscribe to activity updates
 */

import { useState, useEffect, useCallback } from 'react';
import { staffProfileApi } from '@/lib/api';

export interface Activity {
  id: string;
  type: string;
  msg: string;
  icon: string;
  color: string;
  actorName?: string;
  actorEmail?: string;
  createdAt?: string;
  time?: string;
}

export interface ActivityLogOptions {
  limit?: number;
  pollInterval?: number; // in milliseconds, default 30000 (30s)
  autoRefresh?: boolean;
}

export const useActivityLog = (options: ActivityLogOptions = {}) => {
  const {
    limit = 15,
    pollInterval = 30000,
    autoRefresh = true
  } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch activities from backend
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await staffProfileApi.getDashboardActivities(limit);
      const items: Activity[] = Array.isArray(res) ? res : (res?.data ?? []);
      
      setActivities(items.map((a: Activity) => ({
        ...a,
        time: a.createdAt ? formatRelativeTime(a.createdAt) : 'Just now'
      })));
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[useActivityLog] Failed to fetch activities:', err);
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Log a new activity
  const logActivity = useCallback(async (
    type: string,
    msg: string,
    icon: string,
    color: string
  ) => {
    try {
      await staffProfileApi.logActivity({ type, msg, icon, color });
      // Refresh activities after logging
      await fetchActivities();
    } catch (err) {
      console.error('[useActivityLog] Failed to log activity:', err);
    }
  }, [fetchActivities]);

  // Add activity to local state immediately (for optimistic updates)
  const addActivityOptimistic = useCallback((
    type: string,
    msg: string,
    icon: string,
    color: string,
    actorName?: string
  ) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      msg,
      icon,
      color,
      actorName: actorName || 'Staff',
      createdAt: new Date().toISOString(),
      time: 'Just now'
    };
    
    setActivities(prev => [newActivity, ...prev].slice(0, limit));
    
    // Also log it on the backend asynchronously
    logActivity(type, msg, icon, color).catch(console.error);
  }, [limit, logActivity]);

  // Set up auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial fetch
    fetchActivities();

    // Set up polling interval
    const interval = setInterval(fetchActivities, pollInterval);

    return () => clearInterval(interval);
  }, [fetchActivities, autoRefresh, pollInterval]);

  return {
    activities,
    loading,
    error,
    lastUpdated,
    fetchActivities,
    logActivity,
    addActivityOptimistic
  };
};

// Helper function to format relative time
function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Just now';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-IN');
  } catch {
    return 'Recently';
  }
}

export default useActivityLog;
