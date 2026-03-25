import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user_id");

    if (localStorage.getItem("user_role") === "Admin") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
    }

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
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 13h8v8H3v-8Zm10-10h8v6h-8V3ZM13 11h8v10h-8V11ZM3 3h8v8H3V3Z"
        />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v2H2v-2Zm13 0a5 5 0 0 1 10 0v2H15v-2Z"
        />
      </svg>
    ),
    requests: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 12h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h6v2H8V8Z"
        />
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
        />
      </svg>
    ),
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-y-hidden select-none cursor-default">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-[#1E4B6B] flex flex-col border-r overflow-hidden caret-transparent">
        <div className="p-4 border-b border-[#1E4B6B] bg-white">
          <img
            src="/src/assets/logo.png"
            alt="Admin Logo"
            className="h-[140px] w-auto mx-auto"
          />
          <div className="mt-2 text-sm font-semibold tracking-wide text-[#1E4B6B] text-center">
            Admin Panel
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-3 rounded hover:bg-[#EAF1FF] flex items-center gap-3 transition-colors ${
                  isActive
                    ? "bg-[#1E4B6B] text-white"
                    : "text-[#1E4B6B]"
                }`
              }
            >
              {() => (
                <>
                  <span className="shrink-0">
                    {iconMap[item.icon]}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
