import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  deleteClaim,
  getClaimsByCycle,
} from "../controllers/claimsController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin", "Dairy", "Account"]));

// CRUD operations
router.post("/", createClaim);
router.get("/", getClaims);
router.get("/:id", getClaimById);
router.put("/:id", updateClaim);
router.delete("/:id", deleteClaim);

// Cycle-specific operations
router.get("/cycle/:billingCycleId", getClaimsByCycle);

export default router;
