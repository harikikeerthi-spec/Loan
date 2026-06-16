"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: string;
  metadata?: any;
  isRead?: boolean;
}

interface NotificationsPanelProps {
  staffId?: string;
  onNotificationClick?: (notification: Notification) => void;
  maxDisplay?: number;
  showUnreadBadge?: boolean;
}

const NotificationsPanel = ({
  staffId,
  onNotificationClick,
  maxDisplay = 5,
  showUnreadBadge = true,
}: NotificationsPanelProps) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Real-time toast & view-all modal state
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'application_created' | 'document_uploaded' | 'candidate_registered'>('all');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get icon and color based on notification type
  const getNotificationStyle = (type: string) => {
    const styles: Record<string, any> = {
      candidate_registered: {
        icon: "person_add",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-700",
        badge: "bg-blue-500",
      },
      application_created: {
        icon: "assignment",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        textColor: "text-indigo-700",
        badge: "bg-indigo-500",
      },
      document_uploaded: {
        icon: "description",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-700",
        badge: "bg-emerald-500",
      },
      application_submitted: {
        icon: "send",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-700",
        badge: "bg-purple-500",
      },
      default: {
        icon: "notifications",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        textColor: "text-slate-700",
        badge: "bg-slate-500",
      },
    };
    return styles[type] || styles.default;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  useEffect(() => {
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || (
      typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
        ? window.location.origin
        : 'http://localhost:5000'
    );
    // Use portal-specific token keys (staff portal uses "staffAccessToken")
    const token =
      localStorage.getItem("staffAccessToken") ||
      localStorage.getItem("adminAccessToken") ||
      localStorage.getItem("accessToken");

    const socketUrl = baseApiUrl.endsWith("/api")
      ? baseApiUrl.replace("/api", "/chat")
      : `${baseApiUrl.replace(/\/$/, "")}/chat`;

    socketRef.current = io(socketUrl, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on("connect", () => {
      console.log("[NotificationsPanel] Connected to socket.io");
      setIsConnected(true);
      // Join staff notification room
      socketRef.current?.emit("joinRoom", "room_staff");
    });

    socketRef.current.on("notification_received", (payload: Notification) => {
      console.log("[NotificationsPanel] Received notification:", payload);
      setNotifications((prev) => {
        const updated = [payload, ...prev];
        return updated.slice(0, 50); // Keep last 50 notifications
      });
      setUnreadCount((prev) => prev + 1);

      // Trigger Toast Alert
      setActiveToast(payload);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 6000); // Show for 6 seconds
    });

    socketRef.current.on("disconnect", () => {
      console.log("[NotificationsPanel] Disconnected from socket.io");
      setIsConnected(false);
    });

    socketRef.current.on("error", (error: any) => {
      console.error("[NotificationsPanel] Socket error:", error);
    });

    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setNotifications(data.items.slice(0, 50));
            const unread = data.items.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
          }
        } else {
          console.error("[NotificationsPanel] Failed to fetch notifications:", res.statusText);
        }
      } catch (err) {
        console.error("[NotificationsPanel] Fetch error:", err);
      }
    };

    fetchNotifications();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    onNotificationClick?.(notification);

    // Remove the notification from the list entirely when clicked
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));

    if (!notification.isRead) {
      // Optimistic update for unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const token =
          localStorage.getItem("staffAccessToken") ||
          localStorage.getItem("adminAccessToken") ||
          localStorage.getItem("accessToken");

        await fetch(`/api/notifications/${notification.id}/mark-read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("[NotificationsPanel] Failed to mark read:", err);
      }
    }

    // Navigation logic
    try {
      setIsOpen(false);

      let metadata = notification.metadata;
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.warn("[NotificationsPanel] Failed to parse metadata string:", e);
        }
      }

      let appId = metadata?.applicationId || metadata?.id;
      let userId = metadata?.userId || metadata?.studentId;
      const email = metadata?.candidateEmail || metadata?.email || notification.body?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];

      if (!appId && !userId) {
        // Fallback: Parse from body / title (for legacy/existing notifications)
        const appNumRegex = /(?:VL-)?APP-[\w-]+/i;
        const appNumMatch = notification.body?.match(appNumRegex) || notification.title?.match(appNumRegex);

        if (appNumMatch) {
          const appNum = appNumMatch[0];
          console.log(`[NotificationsPanel] Parsed application number ${appNum} from notification, fetching ID...`);
          const appsRes = await adminApi.getApplications({ search: appNum }) as any;
          const foundApp = appsRes.data?.find((a: any) => 
            a.applicationNumber?.toLowerCase() === appNum.toLowerCase()
          );
          if (foundApp) {
            appId = foundApp.id || foundApp._id;
          }
        } else if (email) {
          console.log(`[NotificationsPanel] Parsed email ${email} from notification, fetching user ID...`);
          const usersRes = await adminApi.getUsers(20, 0, email) as any;
          const foundUser = usersRes.items?.find((u: any) => 
            u.email?.toLowerCase() === email.toLowerCase()
          );
          if (foundUser) {
            userId = foundUser.id || foundUser._id;
          }
        }
      }

      // Try resolving application ID by email if we have no direct appId
      if (!appId && email) {
        console.log(`[NotificationsPanel] Attempting to find application by searching user email: ${email}`);
        const appsRes = await adminApi.getApplications({ search: email }) as any;
        if (appsRes.success && Array.isArray(appsRes.data) && appsRes.data.length > 0) {
          const sorted = [...appsRes.data].sort((a: any, b: any) => 
            new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime()
          );
          appId = sorted[0].id || sorted[0]._id;
        }
      }

      if (appId) {
        router.push(`/staff/applications/${appId}`);
      } else if (userId) {
        router.push(`/staff/users/${userId}`);
      } else if (notification.type === 'application_created' || notification.type === 'application_submitted') {
        router.push('/staff/dashboard?section=incoming_queue');
      } else {
        console.warn("[NotificationsPanel] Could not resolve application ID or user ID for notification:", notification);
      }
    } catch (routeErr) {
      console.error("[NotificationsPanel] Error navigating to notification details:", routeErr);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const token =
        localStorage.getItem("staffAccessToken") ||
        localStorage.getItem("adminAccessToken") ||
        localStorage.getItem("accessToken");

      await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("[NotificationsPanel] Failed to mark all read:", err);
    }
  };

  const displayedNotifications = notifications.slice(0, maxDisplay);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>

        {/* Unread Badge */}
        {showUnreadBadge && unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}

        {/* Connection indicator */}
        <div
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-slate-300"
          }`}
        />
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined">notifications_active</span>
                    Real-time Notifications
                  </h3>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllRead();
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                    {!isConnected && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded text-[10px] text-yellow-700">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                        Offline
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                <AnimatePresence mode="popLayout">
                  {displayedNotifications.length > 0 ? (
                    displayedNotifications.map((notif, index) => {
                      const style = getNotificationStyle(notif.type);
                      return (
                        <motion.div
                          key={notif.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => handleNotificationClick(notif)}
                          className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:${style.bgColor} transition-colors group`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.bgColor} flex items-center justify-center`}
                            >
                              <span
                                className={`material-symbols-outlined text-[18px] ${style.textColor}`}
                              >
                                {style.icon}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900 line-clamp-1">
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                                {notif.body}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-2">
                                {formatTime(notif.timestamp)}
                              </p>
                            </div>

                            {/* Unread indicator */}
                            {!notif.isRead && (
                              <div className={`w-2 h-2 rounded-full ${style.badge} flex-shrink-0 mt-1`} />
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <span className="material-symbols-outlined text-[40px] block mb-2 opacity-50">
                        notifications_off
                      </span>
                      <p className="text-sm font-medium">No notifications yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        You'll get notified about new candidates and applications
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsAllModalOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors w-full"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Real-time Toast Alert Notification Pop-up */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => {
              handleNotificationClick(activeToast);
              setActiveToast(null);
            }}
            className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-4 cursor-pointer hover:shadow-[0_15px_35px_rgba(0,0,0,0.16)] transition-shadow"
          >
            <div className="flex gap-3">
              {/* Style Icon */}
              {(() => {
                const style = getNotificationStyle(activeToast.type);
                return (
                  <>
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${style.bgColor} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-[20px] ${style.textColor}`}>
                        {style.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-xs text-slate-400 uppercase tracking-widest leading-none">
                          Real-time Alert
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveToast(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition-colors leading-none"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1 line-clamp-1">
                        {activeToast.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {activeToast.body}
                      </p>
                      <p className="text-[10px] text-indigo-600 font-bold mt-2">
                        Click to view details
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View All Modal Overlay */}
      <AnimatePresence>
        {isAllModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAllModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative z-10"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 px-6 py-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[24px] text-indigo-600">notifications_active</span>
                      Latest Notifications
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Manage real-time candidates, application registrations and uploads.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAllModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Filter Tab buttons */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {[
                    { id: 'all', label: 'All Activities' },
                    { id: 'application_created', label: 'Applications' },
                    { id: 'document_uploaded', label: 'Documents' },
                    { id: 'candidate_registered', label: 'Registrations' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedFilter(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedFilter === tab.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body / List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {(() => {
                  const filtered = notifications.filter(n => selectedFilter === 'all' || n.type === selectedFilter);
                  return filtered.length > 0 ? (
                    filtered.map((notif, index) => {
                      const style = getNotificationStyle(notif.type);
                      return (
                        <div
                          key={notif.id || index}
                          onClick={() => {
                            handleNotificationClick(notif);
                            setIsAllModalOpen(false);
                          }}
                          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md flex gap-4 ${
                            notif.isRead
                              ? "border-slate-100 opacity-75 hover:opacity-100"
                              : `border-slate-200 hover:border-slate-300 shadow-sm relative overflow-hidden`
                          }`}
                        >
                          {/* Unread dot indicator on the left side edge */}
                          {!notif.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                          )}

                          {/* Icon Circle */}
                          <div className={`w-11 h-11 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <span className={`material-symbols-outlined text-[20px] ${style.textColor}`}>
                              {style.icon}
                            </span>
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 leading-tight">
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0 mt-0.5">
                                {formatTime(notif.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {notif.body}
                            </p>
                          </div>

                          {/* Status Circle */}
                          {!notif.isRead && (
                            <div className={`w-2.5 h-2.5 rounded-full ${style.badge} flex-shrink-0 self-center`} />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[48px] block mb-2 opacity-30">
                        notifications_off
                      </span>
                      <p className="text-sm font-bold">No notifications match this category</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try switching tabs to check other notification logs.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Showing {notifications.filter(n => selectedFilter === 'all' || n.type === selectedFilter).length} total
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all border border-indigo-100"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPanel;
