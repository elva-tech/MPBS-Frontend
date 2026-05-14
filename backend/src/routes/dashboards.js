import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
	getSocietyDashboard,
	getBmcDashboard,
	getAdminDashboard,
	getDairyDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

<<<<<<< HEAD
router.use(authRequired, requireRole(["Admin","Society","BMC","Audit"]))
=======
router.use(authRequired, requireRole(["Admin", "Society", "BMC", "Dairy"]));
>>>>>>> 59c00f5a9f370b54176bb943f7345ef64c5d77f9

router.get("/society", getSocietyDashboard);
router.get("/bmc", getBmcDashboard);
router.get("/dairy", requireRole(["Dairy", "Admin"]), getDairyDashboard);
router.get("/admin", requireRole(["Admin"]), getAdminDashboard);

export default router;

