import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { getSocietyDashboard, getBmcDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin","Society","BMC","Audit"]))

router.get("/society", getSocietyDashboard);
router.get("/bmc", getBmcDashboard);

export default router;

