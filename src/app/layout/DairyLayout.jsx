import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function DairyLayout() {
  const navigate = useNavigate();
  const dairyName = localStorage.getItem("dairy_name") || "Dairy Operator";

  const handleLogout = () => {
    localStorage.removeItem("dairy_auth");
    localStorage.removeItem("dairy_name");
    localStorage.removeItem("dairy_id");
    navigate("/login/dairy");
  };

  const navItems = [
    { label: "Dashboard", to: "/dairy/dashboard" },
    { label: "Route Sheets", to: "/dairy/route-sheets" },
    { label: "Tanker Verification", to: "/dairy/tanker-verification" },
    { label: "Milk Receipt", to: "/dairy/milk-receipt" },
    { label: "Reports", to: "/dairy/reports" },
  ];

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
        <div className="flex items-center justify-end gap-2 px-6 pt-4 text-[#1F2A44]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" />
          </svg>
          <span className="text-xs font-semibold">{dairyName}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
