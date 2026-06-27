import { NavLink, Outlet, useNavigate } from "react-router-dom";

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
    { label: "Dashboard", to: "/procurement/dashboard" },
    { label: "Products", to: "/procurement/products" },
    { label: "Inventory", to: "/procurement/inventory" },
    { label: "Dispatches", to: "/procurement/dispatches" },
    { label: "Reports", to: "/procurement/reports" },
  ];

  return (
    <div className="flex h-screen bg-[#F7FAFF] text-[#1F2A44] select-none cursor-default">
      <aside className="flex w-64 flex-col border-r border-[#D7E4FF] bg-white text-[#1E4B6B]">
        <div className="border-b border-[#1E4B6B] p-4">
          <img src="/src/assets/logo.png" alt="RBKVMUL Logo" className="mx-auto h-[110px] w-auto object-contain" />
          <p className="mt-2 text-center text-sm font-semibold">Procurement & Inputs</p>
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
          <div className="mb-3 text-xs font-semibold text-[#5B6B7F]">{procurementName}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded px-2 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[linear-gradient(180deg,#F7FAFF_0%,#EEF4FF_100%)]">
        <Outlet />
      </main>
    </div>
  );
}
