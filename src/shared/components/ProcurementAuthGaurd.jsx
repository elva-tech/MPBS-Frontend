import { Navigate } from "react-router-dom";
import { hasModuleSession } from "../../utils/authSession";

export default function ProcurementAuthGuard({ children }) {
  if (!hasModuleSession("procurement", "ProcurementInputs")) {
    return <Navigate to="/procurement/login" replace />;
  }

  return children;
}
