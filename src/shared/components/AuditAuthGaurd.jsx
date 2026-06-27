import { Navigate } from "react-router-dom";

export default function AuditAuthGaurd({ children }) {
  const isAuthenticated = localStorage.getItem("audit_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/audit/login" replace />;
  }

  return children;
}
