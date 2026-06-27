import { Navigate } from "react-router-dom";

export default function AdminAuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("admin_auth") === "true";
  const role = localStorage.getItem("user_role");
  const token = localStorage.getItem("auth_token");

  const hasValidAdminSession = isAuthenticated && role === "Admin" && !!token;

  if (!hasValidAdminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}