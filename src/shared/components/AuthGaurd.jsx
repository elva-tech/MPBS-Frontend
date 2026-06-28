import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function AuthGuard({ children }) {
  if (!hasModuleSession("society", "Society")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
