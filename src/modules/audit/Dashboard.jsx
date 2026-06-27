import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuditDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : "A";

  useEffect(() => {
    const name = localStorage.getItem("audit_name") || "Audit User";
    setUserName(name);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f7] to-[#e8eef5]">
      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Stats Cards */}
          <div className="rounded-lg border border-[#e7e7e7] bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Audits</p>
                <p className="mt-2 text-3xl font-bold text-[#2e5d7b]">0</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-[#2e5d7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#e7e7e7] bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Reviews</p>
                <p className="mt-2 text-3xl font-bold text-[#2e5d7b]">0</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-[#2e5d7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#e7e7e7] bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="mt-2 text-3xl font-bold text-[#2e5d7b]">0</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-[#2e5d7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mt-8 rounded-lg border border-[#e7e7e7] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">Welcome to Audit Dashboard</h2>
          <p className="mt-2 text-slate-600">
            This is the audit module dashboard. You can manage audits, reviews, and generate reports from here.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Use the sidebar to navigate to different sections of the audit system.
          </p>
        </div>
      </div>
    </div>
  );
}
