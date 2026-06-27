import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { 
  listNotifications, 
  createNotification,
  markNotificationAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notificationController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = express.Router();

router.get("/", authRequired, listNotifications);

router.get("/unread-count", authRequired, getUnreadCount);

router.post(
  "/",
  authRequired,
  requireRole(["Admin"]),
  validate(
    z.object({
      sentToRole: z.string().min(1),
      sentToScope: z.enum(["all", "specific"]).optional(),
      sentToUserId: z.string().optional(),
      sentToName: z.string().optional(),
      message: z.string().min(1),
      fileUrl: z.string().optional(),
    })
  ),
  createNotification
);

router.patch(
  "/:notificationId/read",
  authRequired,
  markNotificationAsRead
);

router.delete(
  "/:notificationId",
  authRequired,
  requireRole(["Admin"]),
  deleteNotification
);

export default router;

