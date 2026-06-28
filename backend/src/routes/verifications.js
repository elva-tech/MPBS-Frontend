import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createVerification, listVerifications } from "../controllers/verificationController.js";

const router = express.Router();

router.get("/", authRequired, requireRole(["Admin", "BMC", "Audit", "Auditor"]), listVerifications);
router.post("/", authRequired, requireRole(["Admin", "BMC"]), createVerification);

export default router;

