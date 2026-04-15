import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
	getSocietyDashboard,
	getBmcDashboard,
	getAdminDashboard,
	getDairyDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin", "Society", "BMC", "Dairy"]));

router.get("/society", getSocietyDashboard);
router.get("/bmc", getBmcDashboard);
router.get("/dairy", requireRole(["Dairy", "Admin"]), getDairyDashboard);
router.get("/admin", requireRole(["Admin"]), getAdminDashboard);

export default router;

