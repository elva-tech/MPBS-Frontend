import { Navigate } from "react-router-dom";

export default function BMCAuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("bmc_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/bmc/login" replace />;
  }

  return children;
}
