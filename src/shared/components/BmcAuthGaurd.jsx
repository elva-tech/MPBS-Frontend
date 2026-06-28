import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function BMCAuthGuard({ children }) {
  if (!hasModuleSession("bmc", "BMC")) {
    return <Navigate to="/bmc/login" replace />;
  }

  return children;
}
