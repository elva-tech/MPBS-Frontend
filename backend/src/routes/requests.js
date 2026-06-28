import express from "express";
import { authRequired, authOptional, requireRole } from "../middleware/auth.js";
import { listRequests, listMyRequests, createRequest, updateRequestStatus } from "../controllers/requestController.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { z } from "zod";

const router = express.Router();

const optionalObjectId = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
  z.string().optional()
);

router.get("/", authRequired, requireRole(["Admin"]), asyncHandler(listRequests));
router.get("/mine", authRequired, asyncHandler(listMyRequests));

router.post(
  "/",
  authOptional,
  validate(
    z.object({
      type: z.string().min(1),
      userId: optionalObjectId,
      username: z.string().optional(),
      role: z.string().optional(),
      newPassword: z.string().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      message: z.string().optional(),
      societyName: z.string().optional(),
      societyId: z.string().optional(),
      sessionDate: z.string().optional(),
      sessionCode: z.enum(["M", "E"]).optional(),
      attachmentName: z.string().optional(),
      attachmentUrl: z.string().optional(),
    })
  ),
  asyncHandler(createRequest)
);

router.patch(
  "/:id",
  authRequired,
  requireRole(["Admin"]),
  validate(
    z.object({
      status: z.enum(["pending", "approved", "rejected"]),
      adminActionReason: z.string().optional(),
    })
  ),
  asyncHandler(updateRequestStatus)
);

export default router;
