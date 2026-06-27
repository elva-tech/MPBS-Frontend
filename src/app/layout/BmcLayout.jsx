import { Outlet, NavLink, useNavigate } from "react-router-dom";
import LayoutNotificationBell from "../../modules/bmc/components/LayoutNotificationBell";

export default function BMCLayout() {
  const navigate = useNavigate();
  const showCommentsNav = false;

  const handleLogout = () => {
    localStorage.removeItem("bmc_auth");
    localStorage.removeItem("bmc_name");
    localStorage.removeItem("bmc_id");
    localStorage.removeItem("bmc_user_id");
    localStorage.removeItem("bmc_token");

    if (localStorage.getItem("user_role") === "BMC") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
    }

    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", to: "/bmc/dashboard", icon: "dashboard" },
    { label: "Society Milk Verification", to: "/bmc/verification", icon: "milk" },
    { label: "Truck Sheet", to: "/bmc/truck-sheet", icon: "truck" },
    { label: "Complaints", to: "/bmc/complaints", icon: "complaint" },
    ...(showCommentsNav
      ? [{ label: "Comments", to: "/bmc/reports", icon: "report" }]
      : []),
  ];

  const iconMap = {
    dashboard: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3h7v4h-7v-4Z"
        />
      </svg>
    ),
    milk: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2c3.3 0 6 2.7 6 6 0 2.6-1.7 4.8-4 5.6V22H10v-8.4C7.7 12.8 6 10.6 6 8c0-3.3 2.7-6 6-6Z"
        />
      </svg>
    ),
    truck: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 6h11v9H3V6Zm11 3h3.6l3.4 3.9V15h-7V9Zm-8 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
        />
      </svg>
    ),
    report: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 12h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h6v2H8V8Z"
        />
      </svg>
    ),
    complaint: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"
        />
      </svg>
    ),
  };

  return (
    <div className="flex h-screen bg-[#F8F6F2] select-none cursor-default">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-[#1E4B6B] flex flex-col border-r overflow-hidden caret-transparent">
        <div className="p-4 border-b border-[#1E4B6B] bg-white">
          <img
            src="/src/assets/logo.png"
            alt="BMC Logo"
            className="h-[140px] w-auto mx-auto"
          />
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
        <div className="flex justify-end px-4 pt-4">
          <LayoutNotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
