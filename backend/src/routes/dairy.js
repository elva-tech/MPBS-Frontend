import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  finalizeShipment,
  getDairyReports,
  getShipment,
  listShipments,
  updateShipment,
} from "../controllers/dairyController.js";

const router = express.Router();

const readRoles = ["Dairy", "Admin", "Audit", "Auditor"];
const writeRoles = ["Dairy", "Admin"];

router.use(authRequired);

router.get("/shipments", requireRole(readRoles), listShipments);
router.get("/shipments/:id", requireRole(readRoles), getShipment);
router.patch("/shipments/:id", requireRole(writeRoles), updateShipment);
router.post("/shipments/:id/finalize", requireRole(writeRoles), finalizeShipment);
router.get("/reports", requireRole(readRoles), getDairyReports);

export default router;
