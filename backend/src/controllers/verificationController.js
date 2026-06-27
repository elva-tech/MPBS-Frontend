import { Verification } from "../models/Verification.js";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";

export async function createVerification(req, res) {
  const record = await Verification.create(req.body);
  res.status(201).json({ data: record });
}

export async function listVerifications(req, res) {
  const { societyId, date, session } = req.query;
  const q = {};
  if (societyId) q.societyId = societyId;
  if (date) q.date = date;
  if (session) q.session = session;

  const pagination = getPagination(req.query);

  if (!pagination.enabled) {
    const list = await Verification.find(q).sort({ createdAt: -1 });
    return res.json({ data: list });
  }

  const { page, limit, skip } = pagination;
  const [list, total] = await Promise.all([
    Verification.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Verification.countDocuments(q),
  ]);

  return res.json({ data: list, meta: makePaginationMeta(total, page, limit) });
}
