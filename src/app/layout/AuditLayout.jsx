import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AuditLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auditName, setAuditName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("audit_name") || "Audit User";
    setAuditName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("audit_auth");
    localStorage.removeItem("audit_name");
    localStorage.removeItem("audit_id");
    localStorage.removeItem("audit_user_id");
    localStorage.removeItem("audit_token");

    if (localStorage.getItem("user_role") === "Audit") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
    }

    navigate("/audit/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-y-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-[#1E4B6B] flex flex-col border-r overflow-hidden caret-transparent">
        {/* TOP LOGO */}
        <div className="p-4 border-b border-[#1E4B6B] bg-white">
          <img
            src="/logo1.png"
            alt="Logo"
            className="h-[80px] w-auto mx-auto"
          />
          <h3 className="text-center text-sm font-semibold text-[#1E4B6B] mt-2">
            Audit Module
          </h3>
        </div>

        {/* NAV */}
        <nav className="flex-1 p-2 space-y-1">
          <NavLink
            to="/audit/reports"
            className={({ isActive }) =>
              `block px-4 py-3 rounded hover:bg-[#EAF1FF] flex items-center gap-3 ${
                isActive ? "bg-[#1E4B6B] text-white" : "text-[#1E4B6B]"
              }`
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <rect
                x="4"
                y="3"
                width="16"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 8h8M8 12h8M8 16h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>Audit Reports</span>
          </NavLink>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-[#1E4B6B]">
          <div className="mb-3 text-xs text-slate-600">
            <p className="font-semibold">{auditName}</p>
            <p>Audit User</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 px-2 py-2 rounded text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">
        {/* TOP BAR */}
        <div className="flex items-center px-4 pt-4">
          <div className="flex-1">
            {location.pathname !== "/audit/dashboard" && (
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-[#1E4B6B] hover:underline"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 relative" />
        </div>

        <Outlet />
      </main>
    </div>
  );
}
