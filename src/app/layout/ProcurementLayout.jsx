import { NavLink, Outlet, useNavigate } from "react-router-dom";
import PageContent from "../../shared/components/PageContent";
import { ModuleNavIcons } from "../../shared/components/ModuleNavIcons";

export default function ProcurementLayout() {
  const navigate = useNavigate();
  const procurementName = localStorage.getItem("procurement_name") || "P&I";

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("procurement_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("procurement_auth");
    localStorage.removeItem("procurement_name");
    localStorage.removeItem("procurement_id");
    navigate("/procurement/login");
  };

  const navItems = [
    { label: "Dashboard", to: "/procurement/dashboard", icon: "dashboard" },
    { label: "Products", to: "/procurement/products", icon: "products" },
    { label: "Inventory", to: "/procurement/inventory", icon: "inventory" },
    { label: "Dispatches", to: "/procurement/dispatches", icon: "dispatch" },
    { label: "Reports", to: "/procurement/reports", icon: "report" },
  ];

  return (
    <div className="flex h-screen bg-[#F8F6F2] text-[#1F2A44] select-none cursor-default">
      <aside className="module-sidebar">
        <div className="module-sidebar-logo">
          <img src="/src/assets/logo.png" alt="RBKVMUL Logo" />
          <p className="mt-2 text-center text-sm font-semibold text-[#1E4B6B]">Procurement & Inputs</p>
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
          <p className="module-sidebar-user">{procurementName}</p>
          <button type="button" onClick={handleLogout} className="module-sidebar-logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-[#F8F6F2]">
        <PageContent className="flex-1 overflow-auto">
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
