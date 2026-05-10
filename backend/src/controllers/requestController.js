import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";

export async function listRequests(req, res) {
  const { status } = req.query;
  const q = status ? { status } : {};
  const list = await Request.find(q).sort({ createdAt: -1 });
  res.json({ data: list });
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
