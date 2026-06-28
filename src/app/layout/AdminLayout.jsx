import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { listNotifications, markNotificationAsRead } from "../../utils/api";
import PageContent from "../../shared/components/PageContent";
import { ModuleNavIcons } from "../../shared/components/ModuleNavIcons";

export default function AdminLayout() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("admin_name") || localStorage.getItem("user_id");
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", to: "/admin/dashboard", icon: "dashboard" },
    { label: "User Management", to: "/admin/users", icon: "users" },
    { label: "Requests", to: "/admin/requests", icon: "requests" },
    { label: "Notifications", to: "/admin/notifications", icon: "notifications" },
  ];

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
    <div className="flex h-screen bg-[#F8F6F2] overflow-y-hidden select-none cursor-default">
      <aside className="module-sidebar caret-transparent">
        <div className="module-sidebar-logo">
          <img src="/src/assets/logo.png" alt="Admin Logo" />
        </div>

        <nav className="module-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `module-sidebar-link ${isActive ? "module-sidebar-link-active" : "module-sidebar-link-idle"}`
              }
            >
              <>
                {ModuleNavIcons[item.icon]}
                <span>{item.label}</span>
              </>
            </NavLink>
          ))}
        </nav>

        <div className="module-sidebar-footer">
          <p className="module-sidebar-user">{adminName}</p>
          <button type="button" onClick={handleLogout} className="module-sidebar-logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-h-0 overflow-auto bg-[#F8F6F2]">
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
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#D6DCE5] rounded-lg shadow-lg z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]">
                    <span className="text-sm font-semibold text-[#1F2A44]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-[#1E4B6B] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-[#5B6B7F]">No notifications</div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          onClick={() => markAsRead(item._id)}
                          className={`w-full text-left px-3 py-2 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] ${
                            item.read ? "bg-white" : "bg-[#EEF4FF]/60"
                          }`}
                        >
                          <div className="text-xs text-[#5B6B7F]">To: {item.sentToRole}</div>
                          <div className="text-sm text-[#1F2A44] break-words">{item.message}</div>
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
        <PageContent>
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
