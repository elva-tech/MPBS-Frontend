import { useEffect, useMemo, useRef, useState } from "react";
import { listNotifications, markNotificationAsRead } from "../../../utils/api";

function toTimeAgo(isoDate) {
  if (!isoDate) return "Just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function inferNotifType(message = "") {
  const msg = message.toLowerCase();
  if (msg.includes("fail") || msg.includes("error") || msg.includes("mismatch")) return "error";
  if (msg.includes("pending") || msg.includes("delay") || msg.includes("warning")) return "warning";
  if (msg.includes("verified") || msg.includes("success")) return "success";
  return "info";
}

const TYPE_STYLES = {
  info: { bg: "#EAF1FF", fg: "#1E4B6B" },
  success: { bg: "#E8F8EE", fg: "#1F7A45" },
  warning: { bg: "#FFF6E8", fg: "#9A5D00" },
  error: { bg: "#FDECEC", fg: "#B42318" },
};

function shouldShowForRole(notification, role, userId) {
  const sentToRole = String(notification?.sentToRole || "");
  const sentToScope = String(notification?.sentToScope || "all");
  const sentToUserId = notification?.sentToUserId ? String(notification.sentToUserId) : "";

  const roleAllowed = sentToRole === "All" || sentToRole === "all" || sentToRole === role;
  if (!roleAllowed) return false;

  if (sentToScope !== "specific") return true;
  return Boolean(userId) && sentToUserId === String(userId);
}

export default function LayoutNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const wrapRef = useRef(null);
  const currentUserId = localStorage.getItem("user_id") || "";

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const response = await listNotifications();
        if (!active) return;

        const mapped = (response?.data || [])
          .filter((n) => shouldShowForRole(n, "BMC", currentUserId))
          .map((n) => ({
            id: n._id,
            title: `For ${n.sentToRole}`,
            desc: n.message || "",
            time: toTimeAgo(n.createdAt),
            read: Boolean(n.isRead),
            type: inferNotifType(n.message || ""),
            fileUrl: n.fileUrl,
          }));

        setItems(mapped);
      } catch {
        if (!active) return;
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 60000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const markRead = async (id) => {
    if (!id) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationAsRead(id);
    } catch {
      // keep optimistic UI state
    }
  };

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id).filter(Boolean);
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.allSettled(ids.map((id) => markNotificationAsRead(id)));
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg border border-[#cdd8e6] bg-white text-[#1E4B6B] hover:bg-[#f4f8ff]"
        aria-label="Open notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[120] w-[340px] overflow-hidden rounded-xl border border-[#cdd8e6] bg-white shadow-[0_14px_30px_rgba(15,30,51,0.16)]">
          <div className="flex items-center justify-between border-b border-[#e7eef8] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1E4B6B]">
              Notifications
              {unread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{unread} new</span>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-semibold text-[#1E4B6B] hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#5B6B7F]">No notifications</div>
            ) : (
              items.map((item) => {
                const palette = TYPE_STYLES[item.type] || TYPE_STYLES.info;
                return (
                  <div
                    key={item.id}
                    className={`group flex gap-3 border-b border-[#f0f4fb] px-4 py-3 hover:bg-[#f8fbff] ${item.read ? "" : "bg-[#f3f7ff]"}`}
                    onClick={() => markRead(item.id)}
                  >
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: palette.bg, color: palette.fg }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M2 12h20" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#1E4B6B]">{item.title}</div>
                      <div className="mt-0.5 whitespace-pre-wrap break-words text-xs text-[#4D617A]">{item.desc}</div>
                      <div className="mt-1 text-[11px] text-[#7A8DA8]">{item.time}</div>
                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 inline-block text-xs font-semibold text-[#1E4B6B] hover:underline"
                        >
                          View attachment
                        </a>
                      )}
                    </div>

                    {!item.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1E4B6B]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
