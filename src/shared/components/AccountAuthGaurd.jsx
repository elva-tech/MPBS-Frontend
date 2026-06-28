import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function AccountAuthGuard({ children }) {
  if (!hasModuleSession("account", "Account")) {
    return <Navigate to="/account/login" replace />;
  }

  return children;
}
