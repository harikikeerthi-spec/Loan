"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
    // Initialize Socket.io connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const token = localStorage.getItem("access_token");
    const connectionUrl = apiUrl.endsWith('/') ? `${apiUrl}chat` : `${apiUrl}/chat`;

    socketRef.current = io(connectionUrl, {
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
    });

    socketRef.current.on("disconnect", () => {
      console.log("[NotificationsPanel] Disconnected from socket.io");
      setIsConnected(false);
    });

    socketRef.current.on("error", (error: any) => {
      console.error("[NotificationsPanel] Socket error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick?.(notification);
    // Mark as read
    setUnreadCount((prev) => Math.max(0, prev - 1));
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
                  {!isConnected && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded text-[10px] text-yellow-700">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                      Offline
                    </div>
                  )}
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
              {displayedNotifications.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    View All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPanel;
