import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createSchemeBenefit,
  getSchemeBenefits,
  getSchemeBenefitById,
  updateSchemeBenefit,
  deleteSchemeBenefit,
  getSchemeBenefitsByCycle,
} from "../controllers/schemeBenefitsController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin", "Dairy", "Account"]));

// CRUD operations
router.post("/", createSchemeBenefit);
router.get("/", getSchemeBenefits);
router.get("/:id", getSchemeBenefitById);
router.put("/:id", updateSchemeBenefit);
router.delete("/:id", deleteSchemeBenefit);

// Cycle-specific operations
router.get("/cycle/:billingCycleId", getSchemeBenefitsByCycle);

export default router;
