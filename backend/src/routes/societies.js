import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { listSocieties } from "../controllers/societyController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin", "BMC", "Account", "Accounts", "Auditor"]));

router.get("/", listSocieties);

export default router;

