import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createRecoverable,
  getRecoverables,
  getRecoverableById,
  updateRecoverable,
  deleteRecoverable,
  applyRecoverableForCycle,
  getActiveRecoverablesForCycle,
} from "../controllers/recoverablesController.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin", "Dairy", "Account"]));

// CRUD operations
router.post("/", createRecoverable);
router.get("/", getRecoverables);
router.get("/:id", getRecoverableById);
router.put("/:id", updateRecoverable);
router.delete("/:id", deleteRecoverable);

// Apply for specific cycle
router.post("/:id/apply/:cycleId", applyRecoverableForCycle);

// Get active recoverables for a cycle
router.get("/cycle/:billingCycleId", getActiveRecoverablesForCycle);

export default router;
