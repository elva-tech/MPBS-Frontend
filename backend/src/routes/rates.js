import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { calcRate, listRates } from "../controllers/rateController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

router.use(authRequired, requireRole(["Admin","Society","BMC"]))

router.get("/", listRates);

router.post(
  "/calc",
  validate(
    z.object({
      milkType: z.enum(["Cow", "Buffalo"]),
      fat: z.number(),
      snf: z.number(),
      qty: z.number().optional(),
    })
  ),
  calcRate
);

export default router;

