import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";

export async function listRequests(req, res) {
  const { status } = req.query;
  const q = status ? { status } : {};
  const pagination = getPagination(req.query);

  if (!pagination.enabled) {
    const list = await Request.find(q).sort({ createdAt: -1 });
    return res.json({ data: list });
  }

  const { page, limit, skip } = pagination;
  const [list, total] = await Promise.all([
    Request.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Request.countDocuments(q),
  ]);

  return res.json({ data: list, meta: makePaginationMeta(total, page, limit) });
}

export async function listMyRequests(req, res) {
  const { status, type } = req.query;
  const q = { userId: req.user.id };

  if (status) q.status = status;
  if (type) q.type = type;

  const list = await Request.find(q).sort({ createdAt: -1 });
  res.json({ data: list });
}

export async function createRequest(req, res) {
  const payload = { ...req.body };
  if (payload.type === "forgot_password" && payload.newPassword) {
    payload.newPasswordHash = await bcrypt.hash(payload.newPassword, 10);
    delete payload.newPassword;
  }
  const record = await Request.create(payload);
  res.status(201).json({ data: record });
}

export async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await Request.findByIdAndUpdate(id, { status }, { new: true });

  if (updated && status === "approved" && updated.type === "forgot_password" && updated.userId && updated.newPasswordHash) {
    await User.findByIdAndUpdate(updated.userId, { passwordHash: updated.newPasswordHash });
  }

  res.json({ data: updated });
}
