import express from "express";
import { listBmcUnits, login } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

router.get("/bmc-units", listBmcUnits);

router.post(
  "/login",
  validate(
    z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    })
  ),
  login
);

export default router;
