import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { getSocietyDashboard, getBmcDashboard, getAdminDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin","Society","BMC"]))

router.get("/society", getSocietyDashboard);
router.get("/bmc", getBmcDashboard);
router.get("/admin", requireRole(["Admin"]), getAdminDashboard);

export default router;

