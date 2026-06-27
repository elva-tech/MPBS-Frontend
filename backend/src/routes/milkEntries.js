import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { getMilkEntries, createMilkEntries } from "../controllers/milkController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

router.use(authRequired);

router.get("/", requireRole(["Admin", "Society", "BMC", "Account", "Accounts", "Auditor"]), getMilkEntries);

router.post(
  "/",
  requireRole(["Admin", "Society", "BMC"]),
  validate(
    z.object({
      societyId: z.string().min(1),
      date: z.string().min(8),
      session: z.enum(["M", "E", "morning", "evening"]),
      entries: z.array(
        z.object({
          milkType: z.enum(["Cow", "Buffalo"]),
          fat: z.number(),
          snf: z.number(),
          qty: z.number(),
          rate: z.number(),
          amount: z.number(),
        })
      ),
    })
  ),
  createMilkEntries
);

export default router;

