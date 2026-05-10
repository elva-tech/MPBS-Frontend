import express from "express";
import multer from "multer";
import { authRequired, requireRole } from "../middleware/auth.js";
import { uploadNotificationAttachment, uploadComplaintAttachment } from "../controllers/uploadController.js";
import { config } from "../config/env.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploadMaxMb * 1024 * 1024 },
});

router.post(
  "/notification",
  authRequired,
  requireRole(["Admin"]),
  upload.single("file"),
  uploadNotificationAttachment
);

router.post(
  "/complaint",
  authRequired,
  requireRole(["Society"]),
  upload.single("file"),
  uploadComplaintAttachment
);

export default router;
