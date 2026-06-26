import express from "express";
import { createDispatch } from "../controllers/procurementController.js";
import { createProduct, listProducts, updateProduct } from "../controllers/productsController.js";
import { addStockInward, getInventory } from "../controllers/inventoryController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

// Products
router.post("/products", authRequired, requireRole(["Admin", "ProcurementInputs"]), createProduct);
router.get("/products", authRequired, requireRole(["Admin", "ProcurementInputs", "Account"]), listProducts);
router.put("/products/:id", authRequired, requireRole(["Admin", "ProcurementInputs"]), updateProduct);

// Inventory
router.post(
	"/inventory/inward",
	authRequired,
	requireRole(["Admin", "ProcurementInputs"]),
	validate(
		z.object({ productId: z.string().min(1), quantity: z.number().positive(), vendor: z.string().optional(), invoiceNumber: z.string().optional(), referenceNo: z.string().optional() })
	),
	addStockInward
);
router.get("/inventory", authRequired, requireRole(["Admin", "ProcurementInputs", "Account"]), getInventory);

// Dispatches
router.post("/dispatches", authRequired, requireRole(["Admin", "ProcurementInputs", "BMC"]), createDispatch);

export default router;
