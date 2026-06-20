"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { staffProfileApi } from "@/lib/api";

interface Activity {
  id: string;
  type: string;
  msg: string;
  icon: string;
  color: string;
  actorName?: string;
  createdAt: string;
}

interface ActivityLogWidgetProps {
  limit?: number;
  refreshInterval?: number;
  showFullLog?: boolean;
  onViewAll?: () => void;
}

const getActivityStyles = (type: string) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    new: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    update: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
    upload: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
    share: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
    link: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
    sync: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  };
  return styles[type] || styles.update;
};

const formatOriginalTime = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    let cleanDs = dateStr;
    if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
      if (cleanDs.includes('T') || cleanDs.includes(':')) {
        const formatted = cleanDs.replace(' ', 'T');
        cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
      }
    }
    const date = new Date(cleanDs);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

export default function ActivityLogWidget({ 
  limit = 10, 
  refreshInterval = 30000,
  showFullLog = false,
  onViewAll
}: ActivityLogWidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timestampIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch activities from backend
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res: any = await staffProfileApi.getDashboardActivities(limit);
      const data = Array.isArray(res) ? res : res?.data || [];
      
      const formattedActivities = data.map((activity: any) => ({
        ...activity,
        id: activity.id || `act-${Date.now()}-${Math.random()}`,
        createdAt: activity.createdAt || new Date().toISOString(),
      }));

      setActivities(formattedActivities);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setError("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const token =
      localStorage.getItem("staffAccessToken") ||
      localStorage.getItem("adminAccessToken") ||
      localStorage.getItem("accessToken");
    if (!token) return;

    const baseApiUrl = typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"))
      ? "http://localhost:5000"
      : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000"));
    
    const socketUrl = baseApiUrl.endsWith("/api")
      ? baseApiUrl.replace("/api", "/chat")
      : `${baseApiUrl.replace(/\/$/, "")}/chat`;

    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[ActivityLogWidget] WebSocket connected");
    });

    socket.on("user_activity", (newActivity: Activity) => {
      console.log("[ActivityLogWidget] Received staff activity:", newActivity);
      const formatted = {
        ...newActivity,
        id: newActivity.id || `act-${Date.now()}-${Math.random()}`,
        createdAt: newActivity.createdAt || new Date().toISOString(),
      };
      
      setActivities((prev) => [formatted, ...prev].slice(0, limit));
    });

    socket.on("disconnect", () => {
      console.log("[ActivityLogWidget] WebSocket disconnected");
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [limit]);

  // Setup polling for activities
  useEffect(() => {
    fetchActivities();

    pollIntervalRef.current = setInterval(() => {
      fetchActivities();
    }, refreshInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [limit, refreshInterval]);

  // Auto-refresh timestamp display every 10 seconds
  useEffect(() => {
    timestampIntervalRef.current = setInterval(() => {
      // Trigger re-render to update relative times
      setRefreshKey(prev => prev + 1);
    }, 10000);

    return () => {
      if (timestampIntervalRef.current) {
        clearInterval(timestampIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-600">history</span>
          Recent Activity
        </h3>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {loading && (
              <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            )}
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live connection active" />
          </div>
          <button
            onClick={() => {
              fetchActivities();
              setRefreshKey(prev => prev + 1);
            }}
            className="p-1 hover:bg-slate-100 rounded transition-colors flex items-center"
            title="Refresh activities"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">refresh</span>
          </button>
          {onViewAll && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                onClick={onViewAll}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                title="View full activity log"
              >
                View All
                <span className="material-symbols-outlined text-[12px]">arrow_forward_ios</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto px-2" key={refreshKey}>
        <AnimatePresence mode="popLayout">
          {loading && activities.length === 0 ? (
            // Loading skeleton
            <>
              {[...Array(3)].map((_, i) => (
                <div key={`skeleton-${i}`} className="p-3 rounded-lg bg-slate-50 border border-slate-100 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 px-4">
              <span className="material-symbols-outlined text-4xl text-slate-200 block mb-2">
                history
              </span>
              <p className="text-[12px] font-medium text-slate-400">
                No activities yet
              </p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const styles = getActivityStyles(activity.type);
              const originalTime = formatOriginalTime(activity.createdAt);

              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-3 rounded-lg border ${styles.bg} ${styles.border} hover:shadow-md transition-all group cursor-pointer`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${styles.bg} border ${styles.border}`}>
                      <span className={`material-symbols-outlined text-[16px] ${styles.text}`}>
                        {activity.icon || 'history'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold ${styles.text} line-clamp-2`}>
                        {activity.msg}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.actorName && (
                          <span className="text-[10px] font-medium text-slate-500">
                            by {activity.actorName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{originalTime}</span>
                      </div>
                    </div>

                    {/* Badge for type */}
                    {index === 0 && (
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${styles.bg} ${styles.text}`}>
                          Latest
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 mx-2 mt-2">
          <p className="text-[11px] font-medium text-rose-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
