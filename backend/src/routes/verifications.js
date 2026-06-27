import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createVerification, listVerifications } from "../controllers/verificationController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin","BMC"]))

router.get("/", listVerifications);
router.post("/", createVerification);

export default router;

