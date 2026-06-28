import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../../modules/society/components/NotificationBell";
import PageContent from "../../shared/components/PageContent";
import { clearModuleSession } from "../../utils/authSession";







import { useEffect } from "react";







export default function Layout() {







  const navigate = useNavigate();







  const location = useLocation();







  




  const handleLogout = () => {
    clearModuleSession("society");
    navigate("/login");
  };







  useEffect(() => {}, []);







  return (







    <div className="flex h-screen bg-gray-100 overflow-y-hidden">







      {/* SIDEBAR */}







      <aside className="module-sidebar caret-transparent">







        {/* TOP LOGO */}







        <div className="module-sidebar-logo">







            <img







              src="/src/assets/logo.png"







              alt="RBKVMUL logo"







              className="mx-auto h-[118px] w-auto max-w-full object-contain"







            />







        </div>







        {/* NAV */}







        <nav className="module-sidebar-nav">







          <NavLink







            to="/"







            end







            className={({ isActive }) =>







              `module-sidebar-link ${isActive ? "module-sidebar-link-active" : "module-sidebar-link-idle"}`







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







              `module-sidebar-link ${isActive ? "module-sidebar-link-active" : "module-sidebar-link-idle"}`







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







              `module-sidebar-link ${isActive ? "module-sidebar-link-active" : "module-sidebar-link-idle"}`







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
              `module-sidebar-link ${isActive ? "module-sidebar-link-active" : "module-sidebar-link-idle"}`
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 4h16v14H8l-4 4V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span>Complaints</span>
          </NavLink>
</nav>







        {/* SIDEBAR FOOTER */}







        <div className="module-sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="module-sidebar-logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">







              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />







            </svg>







            <span className="font-medium">Logout</span>







          </button>







        </div>



      </aside>





      {/* MAIN */}







      <main className="flex flex-1 flex-col min-h-0 overflow-auto">







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







                   Back







                </button>







              )}







            </div>














                        <div className="flex items-center gap-4 relative">
                          <NotificationBell />
                        </div>

          </div>







        )}







        <PageContent>
          <Outlet />
        </PageContent>







      </main>







    </div>







  );







}







