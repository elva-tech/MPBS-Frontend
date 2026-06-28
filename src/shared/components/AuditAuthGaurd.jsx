import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function AuditAuthGaurd({ children }) {
  if (!hasModuleSession("audit", "Audit")) {
    return <Navigate to="/audit/login" replace />;
  }

  return children;
}
