import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { listNotifications, markNotificationAsRead } from "../../utils/api";

export default function AdminLayout() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("admin_name") || localStorage.getItem("user_id");
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_name");
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", to: "/admin/dashboard", icon: "dashboard" },
    { label: "User Management", to: "/admin/users", icon: "users" },
    { label: "Requests", to: "/admin/requests", icon: "requests" },
    { label: "Notifications", to: "/admin/notifications", icon: "notifications" },
  ];

  const iconMap = {
    dashboard: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path fill="currentColor" d="M3 13h8v8H3v-8Zm10-10h8v6h-8V3ZM13 11h8v10h-8V11ZM3 3h8v8H3V3Z" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path fill="currentColor" d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v2H2v-2Zm13 0a5 5 0 0 1 10 0v2H15v-2Z" />
      </svg>
    ),
    requests: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path fill="currentColor" d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 12h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h6v2H8V8Z" />
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" />
      </svg>
    ),
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotif(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const response = await listNotifications();
        if (!active) return;
        const mapped = (response?.data || [])
          .filter((item) => item.sentToRole === "All" || item.sentToRole === "Admin")
          .map((item) => ({
          ...item,
          read: Boolean(item.isRead),
        }));
        setNotifications(mapped);
      } catch {
        if (!active) return;
      }
    };

    loadNotifications();
    const id = setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((acc, item) => (item.read ? acc : acc + 1), 0),
    [notifications]
  );

  const markAsRead = async (id) => {
    if (!id) return;
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationAsRead(id);
    } catch {
      // keep optimistic UI state
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id).filter(Boolean);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
  };

  return (
    <div className="flex h-screen bg-[#F8F6F2] select-none cursor-default">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-[#1E4B6B] flex flex-col border-r overflow-hidden caret-transparent">
        <div className="p-4 border-b border-[#1E4B6B] bg-white">
          <img src="/src/assets/logo.png" alt="Admin Logo" className="h-[140px] w-auto mx-auto" />
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-3 rounded hover:bg-[#EAF1FF] flex items-center gap-3 ${
                  isActive ? "bg-[#1E4B6B] text-white" : "text-[#1E4B6B]"
                }`
              }
            >
              <>
                {iconMap[item.icon]}
                <span>{item.label}</span>
              </>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E4B6B] text-sm">
          <button
            onClick={handleLogout}
            className="mt-1 flex items-center gap-2 text-red-600 hover:bg-red-50 px-2 py-2 rounded text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto bg-[#F8F6F2]">
        <div className="flex items-center justify-end px-6 pt-4">
          <div className="flex items-center gap-2 text-[#1F2A44]">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setOpenNotif((v) => !v)}
                className="relative p-1 rounded hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] rounded-full bg-red-600 text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {openNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-blue-700 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-slate-500">No notifications</div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          onClick={() => markAsRead(item._id)}
                          className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-slate-50 ${
                            item.read ? "bg-white" : "bg-blue-50/40"
                          }`}
                        >
                          <div className="text-xs text-slate-500">To: {item.sentToRole}</div>
                          <div className="text-sm text-slate-800 break-words">{item.message}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6Z" />
            </svg>
            <span className="text-xs font-semibold">{adminName}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
