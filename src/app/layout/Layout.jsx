import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const societyName = localStorage.getItem("society_name");

  const handleLogout = () => {
    localStorage.removeItem("society_auth");
    localStorage.removeItem("society_name");
    localStorage.removeItem("society_id");
    localStorage.removeItem("society_user_id");
    localStorage.removeItem("society_token");

    if (localStorage.getItem("user_role") === "Society") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
    }

    navigate("/login");
  };

  useEffect(() => {
    async function loadNotifications() {
      setNotifications([]);
    }
    loadNotifications();
  }, []);

  useEffect(() => {
    setShowNotif(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read: true } : n
        )
      );
    }

    if (notif.attachment) {
      window.open(notif.attachment.url, "_blank");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-y-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-[#1E4B6B] flex flex-col border-r overflow-hidden caret-transparent">
        {/* TOP LOGO */}
        <div className="p-4 border-b border-[#1E4B6B] bg-white">
            <img
              src="/src/assets/logo.png"
              alt="RBKVMUL logo"
              className="h-[140px] w-auto mx-auto"
            />
        </div>

        {/* NAV */}
        <nav className="flex-1 p-2 space-y-1">
          <NavLink
            to="/"
            end
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
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="14"
                y="14"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/collection"
            className={({ isActive }) =>
              `block px-4 py-3 rounded hover:bg-[#EAF1FF] flex items-center gap-3 ${
                isActive ? "bg-[#1E4B6B] text-white" : "text-[#1E4B6B]"
              }`
            }
          >
            {({ isActive }) => {
              const topFill = isActive ? "#BFC7CF" : "#BFC7CF";
              const leftFill = isActive ? "#FFFFFF" : "#1E4B6B";
              const rightFill = isActive ? "#BFC7CF" : "#BFC7CF";

              return (
                <>
                  <svg
                    width="20"
                    height="18"
                    viewBox="0 0 64 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 6c6 7 10 13 10 18a10 10 0 1 1-20 0c0-5 4-11 10-18Z"
                      fill={topFill}
                    />
                    <path
                      d="M16 44a10 10 0 0 1-10-10c0-5 4-11 10-18 6 7 10 13 10 18a10 10 0 0 1-10 10Z"
                      fill={leftFill}
                    />
                    <path
                      d="M40 44a10 10 0 0 1-10-10c0-5 4-11 10-18 6 7 10 13 10 18a10 10 0 0 1-10 10Z"
                      fill={rightFill}
                    />
                  </svg>
                  <span>Milk Collection</span>
                </>
              );
            }}
          </NavLink>

          <NavLink
            to="/ratesheet"
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
            <span>Report</span>
          </NavLink>

          <NavLink
            to="/complaints"
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
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
            </svg>
            <span>Complaints</span>
          </NavLink>

        </nav>

        {/* ✅ SIDEBAR FOOTER (AS IN PDF) */}
        <div className="p-4 border-t border-[#1E4B6B] text-sm">
          {/* Sidebar footer: only logout button (user requested removal of 'Logged in as') */}
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
        {/* TOP BAR (hidden on milk collection for pixel parity) */}
        {location.pathname !== "/collection" &&
          location.pathname !== "/ratesheet" && (
          <div className="flex items-center px-4 pt-4">
            <div className="flex-1">
              {location.pathname !== "/" && (
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
        )}

        <Outlet />
      </main>
    </div>
  );
}


