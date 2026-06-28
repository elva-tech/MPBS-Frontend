import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";
import { unlockMilkSession } from "./milkController.js";

function dedupeMilkUnlockRequests(list = []) {
  const seen = new Set();
  return list.filter((item) => {
    if (item.type !== "milk_unlock") return true;
    const key = `${item.societyId}|${item.sessionDate}|${item.sessionCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function listRequests(req, res) {
  const { type } = req.query;
  const q = { status: req.query.status || "pending" };
  if (type) q.type = type;

  const pagination = getPagination(req.query);

  if (!pagination.enabled) {
    const list = dedupeMilkUnlockRequests(
      await Request.find(q).sort({ createdAt: -1 })
    );
    return res.json({ data: list });
  }

  const { page, limit, skip } = pagination;
  const [list, total] = await Promise.all([
    Request.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Request.countDocuments(q),
  ]);

  return res.json({
    data: dedupeMilkUnlockRequests(list),
    meta: makePaginationMeta(total, page, limit),
  });
}

export async function listMyRequests(req, res) {
  const { status, type } = req.query;
  const orConditions = [{ userId: req.user.id }];

  if (req.user.username) {
    orConditions.push({ username: req.user.username });
    orConditions.push({ societyId: req.user.username });
    orConditions.push({ societyName: req.user.username });
  }

  const q = { $or: orConditions };
  if (status) q.status = status;
  if (type) q.type = type;

  const list = await Request.find(q).sort({ createdAt: -1 });
  res.json({ data: list });
}

function normalizeRequestPayload(body = {}, user = null) {
  const payload = { ...body };

  if (!payload.userId && user?.id) {
    payload.userId = user.id;
  }
  if (!payload.username && user?.username) {
    payload.username = user.username;
  }
  if (!payload.role && user?.role) {
    payload.role = user.role;
  }

  if (payload.userId === "" || payload.userId === null) {
    delete payload.userId;
  }

  return payload;
}

export async function createRequest(req, res) {
  const payload = normalizeRequestPayload(req.body, req.user);

  if (payload.type === "forgot_password" && payload.newPassword) {
    payload.newPasswordHash = await bcrypt.hash(payload.newPassword, 10);
    delete payload.newPassword;
  }

  if (payload.type === "milk_unlock") {
    const { societyId, sessionDate, sessionCode } = payload;
    if (!societyId || !sessionDate || !sessionCode) {
      return res.status(400).json({
        message: "societyId, sessionDate and sessionCode are required for milk unlock",
      });
    }

    const existing = await Request.findOne({
      type: "milk_unlock",
      societyId,
      sessionDate,
      sessionCode,
      status: "pending",
    });

    if (existing) {
      if (payload.message) existing.message = payload.message;
      if (payload.username) existing.username = payload.username;
      if (payload.societyName) existing.societyName = payload.societyName;
      await existing.save();
      return res.json({
        data: existing,
        message: "Unlock request already pending for this session",
      });
    }
  }

  const record = await Request.create(payload);
  res.status(201).json({ data: record });
}

export async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { status, adminActionReason } = req.body;

  const updated = await Request.findByIdAndUpdate(
    id,
    {
      status,
      ...(adminActionReason ? { adminActionReason } : {}),
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (updated.status === "approved" && updated.type === "forgot_password" && updated.userId && updated.newPasswordHash) {
    await User.findByIdAndUpdate(updated.userId, { passwordHash: updated.newPasswordHash });
  }

  if (updated.status === "approved" && updated.type === "milk_unlock") {
    await unlockMilkSession({
      societyId: updated.societyId,
      date: updated.sessionDate,
      sessionCode: updated.sessionCode,
    });
  }

  res.json({ data: updated });
}
