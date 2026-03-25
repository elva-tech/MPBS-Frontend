import { Notification } from "../models/Notification.js";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";

const ROLE_CANONICAL = {
  all: "All",
  admin: "Admin",
  society: "Society",
  bmc: "BMC",
  eo: "EO",
  dairy: "Dairy",
  other: "Other",
};

const ALLOWED_NOTIFICATION_ROLES = new Set(["All", "Society", "BMC", "EO", "Dairy", "Other"]);

function normalizeRole(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return ROLE_CANONICAL[normalized] || String(value).trim();
}

function activeOrLegacyStatusFilter() {
  return {
    $or: [{ status: "active" }, { status: { $exists: false } }, { status: null }],
  };
}

export async function listNotifications(req, res) {
  const { role, status } = req.query;
  const q = {};
  const userRole = normalizeRole(req.user?.role);
  const userId = req.user?.id;

  if (status) {
    q.status = String(status).trim();
  } else {
    Object.assign(q, activeOrLegacyStatusFilter());
  }

  if (userRole === "Admin") {
    if (role) {
      q.sentToRole = normalizeRole(role);
    }
  } else {
    q.$or = [
      { sentToRole: { $in: ["All", "all"] } },
      {
        sentToRole: userRole,
        $or: [
          { sentToScope: "all" },
          { sentToScope: { $exists: false } },
          { sentToUserId: userId },
        ],
      },
    ];
  }

  const pagination = getPagination(req.query);

  if (!pagination.enabled) {
    const list = await Notification.find(q)
      .populate("sentBy", "username role")
      .sort({ createdAt: -1 });
    
    // Add isRead flag for current user
    const listWithReadStatus = list.map((notif) => ({
      ...notif.toObject(),
      isRead: notif.readBy.some((rb) => rb.userId.toString() === userId),
    }));
    
    return res.json({ data: listWithReadStatus });
  }

  const { page, limit, skip } = pagination;
  const [list, total] = await Promise.all([
    Notification.find(q)
      .populate("sentBy", "username role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(q),
  ]);

  // Add isRead flag for current user
  const listWithReadStatus = list.map((notif) => ({
    ...notif.toObject(),
    isRead: notif.readBy.some((rb) => rb.userId.toString() === userId),
  }));

  return res.json({ 
    data: listWithReadStatus, 
    meta: makePaginationMeta(total, page, limit) 
  });
}

export async function createNotification(req, res) {
  const sentToRole = normalizeRole(req.body.sentToRole);
  if (!ALLOWED_NOTIFICATION_ROLES.has(sentToRole)) {
    return res.status(400).json({ message: "Invalid sentToRole" });
  }

  const payload = {
    sentToRole,
    sentToScope: req.body.sentToScope || "all",
    message: req.body.message,
    fileUrl: req.body.fileUrl,
    sentBy: req.user?.id,
  };

  if (payload.sentToScope === "specific" && req.body.sentToUserId) {
    payload.sentToUserId = req.body.sentToUserId;
    payload.sentToName = req.body.sentToName || "";
  }

  const record = await Notification.create(payload);
  const populated = await record.populate("sentBy", "username role");
  
  res.status(201).json({ 
    data: {
      ...populated.toObject(),
      isRead: false,
    }
  });
}

export async function markNotificationAsRead(req, res) {
  const { notificationId } = req.params;
  const userId = req.user?.id;

  const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  // Check if already read by this user
  const alreadyRead = notification.readBy.some(
    (rb) => rb.userId.toString() === userId
  );

  if (!alreadyRead) {
    notification.readBy.push({
      userId,
      readAt: new Date(),
    });
    await notification.save();
  }

  res.json({ 
    data: {
      ...notification.toObject(),
      isRead: true,
    }
  });
}

export async function deleteNotification(req, res) {
  const { notificationId } = req.params;
  const userRole = req.user?.role;

  // Only Admins can delete notifications
  if (userRole !== "Admin") {
    return res.status(403).json({ message: "Only admins can delete notifications" });
  }

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { status: "archived" },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json({ data: notification });
}

export async function getUnreadCount(req, res) {
  const userId = req.user?.id;
  const userRole = normalizeRole(req.user?.role);

  const q = activeOrLegacyStatusFilter();

  if (userRole === "Admin") {
    // Admins see no unread count in this context
    return res.json({ unreadCount: 0 });
  } else {
    q.$or = [
      { sentToRole: { $in: ["All", "all"] } },
      {
        sentToRole: userRole,
        $or: [
          { sentToScope: "all" },
          { sentToScope: { $exists: false } },
          { sentToUserId: userId },
        ],
      },
    ];
  }

  // Count notifications not read by this user
  const unreadCount = await Notification.countDocuments({
    ...q,
    readBy: { $not: { $elemMatch: { userId } } },
  });

  res.json({ unreadCount });
}

