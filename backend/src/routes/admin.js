import express from "express";
import { 
  getDashboardStats,
  listUsers, 
  createUser, 
  updateUserAuth,
  deleteUser,
  updateUser,
  resetUserPassword,
} from "../controllers/adminController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, requireRole(["Admin"]));

router.get("/stats", getDashboardStats);

router.get("/users", listUsers);

router.post(
  "/users",
  validate(
    z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      role: z.enum(["Admin", "Society", "BMC", "EO", "Dairy", "Account", "ProcurementInputs", "Other"]),
      profile: z.record(z.any()).optional(),
    })
  ),
  createUser
);

router.patch(
  "/users/:id/auth",
  validate(z.object({ authStatus: z.enum(["Approved", "Pending", "Rejected"]) })),
  updateUserAuth
);

router.patch(
  "/users/:id",
  validate(
    z.object({
      username: z.string().min(3).optional(),
      role: z.enum(["Admin", "Society", "BMC", "EO", "Dairy", "Account", "ProcurementInputs", "Other"]).optional(),
      authStatus: z.enum(["Approved", "Pending", "Rejected"]).optional(),
      profile: z.record(z.any()).optional(),
    })
  ),
  updateUser
);

router.delete("/users/:id", deleteUser);

router.post(
  "/users/:id/reset-password",
  validate(z.object({ newPassword: z.string().min(6) })),
  resetUserPassword
);

export default router;

