import { MilkEntry } from "../models/MilkEntry.js";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";

const SOCIETY_FIXED_RATE = Number(process.env.SOCIETY_FIXED_RATE || 45);

function normalizeMilkType(milkType = "") {
  const value = String(milkType).trim().toLowerCase();
  if (value === "cow" || value === "cow milk") return "Cow";
  if (value === "buffalo" || value === "buffalo milk") return "Buffalo";
  return milkType;
}

export async function getMilkEntries(req, res) {
  const { societyId, date, session, from, to } = req.query;
  const q = {};

  if (societyId) q.societyId = societyId;

  if (date) {
    q.date = date;
  } else if (from || to) {
    q.date = {};
    if (from) q.date.$gte = from;
    if (to) q.date.$lte = to;
  }

  if (session) {
    const sessionValue = String(session).toLowerCase();
    q.session = sessionValue === "morning" ? "M" : sessionValue === "evening" ? "E" : session;
  }

  const pagination = getPagination(req.query);

  if (!pagination.enabled) {
    const entries = await MilkEntry.find(q).sort({ date: 1, session: 1, createdAt: 1 });
    return res.json({ data: { milkEntries: entries } });
  }

  const { page, limit, skip } = pagination;
  const [entries, total] = await Promise.all([
    MilkEntry.find(q).sort({ date: 1, session: 1, createdAt: 1 }).skip(skip).limit(limit),
    MilkEntry.countDocuments(q),
  ]);

  return res.json({
    data: { milkEntries: entries },
    meta: makePaginationMeta(total, page, limit),
  });
}

export async function createMilkEntries(req, res) {
  const { societyId, date, session, entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: "Entries required" });
  }

  const sessionValue = session === "morning" ? "M" : session === "evening" ? "E" : session;
  const docs = entries.map((e) => {
    const qty = Number(e.qty) || 0;
    const rate = SOCIETY_FIXED_RATE;
    return {
      societyId,
      date,
      session: sessionValue,
      milkType: normalizeMilkType(e.milkType),
      fat: e.fat,
      snf: e.snf,
      qty,
      rate,
      amount: Number((qty * rate).toFixed(2)),
    };
  });

  const saved = await MilkEntry.insertMany(docs);
  res.status(201).json({ data: saved });
}
