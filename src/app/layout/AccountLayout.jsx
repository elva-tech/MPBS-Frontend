import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationBell from "../../modules/account/components/NotificationBell";
import { INITIAL_NOTIFICATIONS } from "../../modules/account/utils/notificationEngine";
import "../../modules/account/AccountLayout.css";

export default function AccountLayout() {
  const navigate = useNavigate();
  const accountName = localStorage.getItem("account_name") || "Account User";
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("account_notifications");
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("account_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const handleMarkNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismissNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleAcceptNotification = (notificationId) => {
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) {
      console.log("Notification accepted:", notif);
      // You can add custom logic here for different notification types
      // For example, navigate to a specific page or trigger an action
    }
  };
  const navItems = [
    { label: "Dashboard", to: "/account/dashboard" },
    { label: "Billing Cycles", to: "/account/billing-cycles" },
    { label: "Society Payments", to: "/account/society-payments" },
    { label: "Schemes", to: "/account/schemes" },
    { label: "Claims & Recoverables", to: "/account/claims-recoverables" },
    { label: "Invoices", to: "/account/invoices" },
    { label: "Reports", to: "/account/reports" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("account_auth");
    localStorage.removeItem("account_name");
    localStorage.removeItem("account_id");
    navigate("/account/login");
  };

  return (
    <div className="flex h-screen bg-[linear-gradient(180deg,#F7FAFF_0%,#EEF4FF_100%)] select-none cursor-default">
      <aside className="flex w-64 flex-col border-r bg-white text-[#1E4B6B]">
        <div className="border-b border-[#1E4B6B] p-4">
          <img src="/src/assets/logo.png" alt="RBKVMUL Logo" className="mx-auto h-[110px] w-auto object-contain" />
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded px-4 py-3 text-sm font-medium ${
                  isActive ? "bg-[#1E4B6B] text-white" : "text-[#1E4B6B] hover:bg-[#EAF1FF]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#1E4B6B] bg-white p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex items-center gap-2 rounded px-2 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[linear-gradient(180deg,#F7FAFF_0%,#EEF4FF_100%)]">
        <div className="flex items-center justify-end gap-4 px-6 pt-4 text-[#1F2A44]">
          <NotificationBell
            notifs={notifications}
            onMarkRead={handleMarkNotificationAsRead}
            onMarkAll={handleMarkAllAsRead}
            onDismiss={handleDismissNotification}
            onClearAll={handleClearAllNotifications}
            onAccept={handleAcceptNotification}
          />
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6Z" />
            </svg>
            <span className="text-xs font-semibold">{accountName}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
