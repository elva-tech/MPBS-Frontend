import express from "express";
import { getCycleStatus } from "../controllers/cyclesController.js";

const router = express.Router();

router.get("/status", getCycleStatus);

export default router;