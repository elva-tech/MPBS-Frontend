import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationBell from "../../modules/account/components/NotificationBell";
import { INITIAL_NOTIFICATIONS } from "../../modules/account/utils/notificationEngine";
import PageContent from "../../shared/components/PageContent";
import { ModuleNavIcons } from "../../shared/components/ModuleNavIcons";
import "../../modules/account/AccountLayout.css";

export default function AccountLayout() {
  const navigate = useNavigate();
  const accountName = localStorage.getItem("account_name") || "Account User";
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("account_notifications");
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  });

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
    }
  };

  const navItems = [
    { label: "Dashboard", to: "/account/dashboard", icon: "dashboard" },
    { label: "Billing Cycles", to: "/account/billing-cycles", icon: "billing" },
    { label: "Society Payments", to: "/account/society-payments", icon: "payments" },
    { label: "Schemes", to: "/account/schemes", icon: "schemes" },
    { label: "Claims & Recoverables", to: "/account/claims-recoverables", icon: "claims" },
    { label: "Invoices", to: "/account/invoices", icon: "invoice" },
    { label: "Reports", to: "/account/reports", icon: "report" },
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
    <div className="flex h-screen bg-[#F8F6F2] select-none cursor-default">
      <aside className="module-sidebar">
        <div className="module-sidebar-logo">
          <img src="/src/assets/logo.png" alt="RBKVMUL Logo" />
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
          <p className="module-sidebar-user">{accountName}</p>
          <button type="button" onClick={handleLogout} className="module-sidebar-logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-[#F8F6F2]">
        <div className="flex shrink-0 items-center justify-end gap-4 px-4 pt-3 pb-1 text-[#1F2A44] lg:px-6">
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
        <PageContent className="flex-1 overflow-auto">
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
