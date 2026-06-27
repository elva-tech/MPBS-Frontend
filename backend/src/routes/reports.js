import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { milkProcuredReport, milkRejectedReport, overheadsReport, qualityReport } from "../controllers/reportController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin","Society","BMC"]))

router.get("/milk-procured", milkProcuredReport);
router.get("/milk-rejected", milkRejectedReport);
router.get("/overheads", overheadsReport);
router.get("/quality", qualityReport);

export default router;

