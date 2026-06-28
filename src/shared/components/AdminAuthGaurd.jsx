import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function AdminAuthGuard({ children }) {
  if (!hasModuleSession("admin", "Admin")) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
