import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createSchemeDeduction,
  getSchemeDeductions,
  getSchemeDeductionById,
  updateSchemeDeduction,
  deleteSchemeDeduction,
  getSchemeDeductionsByCycle,
} from "../controllers/schemeDeductionController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin", "Dairy", "Account"]));

// CRUD operations
router.post("/", createSchemeDeduction);
router.get("/", getSchemeDeductions);
router.get("/:id", getSchemeDeductionById);
router.put("/:id", updateSchemeDeduction);
router.delete("/:id", deleteSchemeDeduction);

// Cycle-specific operations
router.get("/cycle/:billingCycleId", getSchemeDeductionsByCycle);

export default router;
