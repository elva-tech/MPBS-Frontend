import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PageContent from "../../shared/components/PageContent";
import { ModuleNavIcons } from "../../shared/components/ModuleNavIcons";

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
    <div className="flex h-screen bg-[#F8F6F2] overflow-y-hidden">
      {/* SIDEBAR */}
      <aside className="module-sidebar caret-transparent">
        <div className="module-sidebar-logo">
          <img src="/logo1.png" alt="Logo" className="!h-[80px]" />
          <h3 className="mt-2 text-center text-sm font-semibold text-[#1E4B6B]">Audit Module</h3>
        </div>

        <nav className="module-sidebar-nav">
          <NavLink
            to="/audit/reports"
            className={({ isActive }) =>
              `module-sidebar-link ${isActive ? "module-sidebar-link-active" : "module-sidebar-link-idle"}`
            }
          >
            {ModuleNavIcons.audit}
            <span>Audit Reports</span>
          </NavLink>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="module-sidebar-footer">
          <p className="module-sidebar-user">{auditName}</p>
          <button type="button" onClick={handleLogout} className="module-sidebar-logout">
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
      <main className="flex flex-1 flex-col min-h-0 overflow-auto">
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

        <PageContent>
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
