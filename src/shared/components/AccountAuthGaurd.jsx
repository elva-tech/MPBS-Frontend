import { Navigate } from "react-router-dom";

export default function AccountAuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("account_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/account/login" replace />;
  }

  return children;
}
