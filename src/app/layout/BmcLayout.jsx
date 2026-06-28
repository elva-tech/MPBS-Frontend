import { Outlet, NavLink, useNavigate } from "react-router-dom";
import LayoutNotificationBell from "../../modules/bmc/components/LayoutNotificationBell";
import PageContent from "../../shared/components/PageContent";
import { ModuleNavIcons } from "../../shared/components/ModuleNavIcons";

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

  return (
    <div className="flex h-screen bg-[#F8F6F2] select-none cursor-default">
      <aside className="module-sidebar caret-transparent">
        <div className="module-sidebar-logo">
          <img src="/src/assets/logo.png" alt="BMC Logo" />
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
          <button type="button" onClick={handleLogout} className="module-sidebar-logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-h-0 overflow-auto bg-[#F8F6F2]">
        <div className="flex justify-end px-4 pt-4">
          <LayoutNotificationBell />
        </div>
        <PageContent>
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
