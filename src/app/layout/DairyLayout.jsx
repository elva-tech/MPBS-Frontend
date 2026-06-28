import { NavLink, Outlet, useNavigate } from "react-router-dom";
import PageContent from "../../shared/components/PageContent";
import { ModuleNavIcons } from "../../shared/components/ModuleNavIcons";
import { clearModuleSession } from "../../utils/authSession";

export default function DairyLayout() {
  const navigate = useNavigate();
  const dairyName = localStorage.getItem("dairy_name") || "Dairy Operator";

  const handleLogout = () => {
    clearModuleSession("dairy");
    navigate("/dairy/login");
  };

  const navItems = [
    { label: "Dashboard", to: "/dairy/dashboard", icon: "dashboard" },
    { label: "Route Sheets", to: "/dairy/route-sheets", icon: "route" },
    { label: "Tanker Verification", to: "/dairy/tanker-verification", icon: "tanker" },
    { label: "Milk Receipt", to: "/dairy/milk-receipt", icon: "receipt" },
    { label: "Reports", to: "/dairy/reports", icon: "report" },
  ];

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
          <p className="module-sidebar-user">{dairyName}</p>
          <button type="button" onClick={handleLogout} className="module-sidebar-logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-[#F8F6F2]">
        <div className="flex shrink-0 items-center justify-end gap-2 px-4 pt-3 pb-1 text-[#1F2A44] lg:px-6">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" />
          </svg>
          <span className="text-xs font-semibold">{dairyName}</span>
        </div>
        <PageContent className="flex-1 overflow-auto">
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
