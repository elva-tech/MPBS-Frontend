import { Navigate } from "react-router-dom";

export default function ProcurementAuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("procurement_auth") === "true";
  const role = localStorage.getItem("user_role");
  const token = localStorage.getItem("procurement_token") || localStorage.getItem("auth_token");

  if (!isAuthenticated || role !== "ProcurementInputs" || !token) {
    return <Navigate to="/procurement/login" replace />;
  }

  return children;
}
