import { Navigate } from "react-router-dom";

export default function DairyAuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("dairy_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/login/dairy" replace />;
  }

  return children;
}
