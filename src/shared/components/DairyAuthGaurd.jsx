import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function DairyAuthGuard({ children }) {
  if (!hasModuleSession("dairy", "Dairy")) {
    return <Navigate to="/dairy/login" replace />;
  }

  return children;
}
