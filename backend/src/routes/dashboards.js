import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
	getSocietyDashboard,
	getBmcDashboard,
	getAdminDashboard,
	getDairyDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/society",
  authRequired,
  requireRole(["Admin", "Society", "BMC", "Audit", "Auditor"]),
  getSocietyDashboard
);
router.get(
  "/bmc",
  authRequired,
  requireRole(["Admin", "BMC", "Audit", "Auditor"]),
  getBmcDashboard
);
router.get(
  "/dairy",
  authRequired,
  requireRole(["Dairy", "Admin", "Audit", "Auditor"]),
  getDairyDashboard
);
router.get(
  "/admin",
  authRequired,
  requireRole(["Admin", "Audit", "Auditor"]),
  getAdminDashboard
);

export default router;

