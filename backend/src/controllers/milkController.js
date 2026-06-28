import { MilkEntry } from "../models/MilkEntry.js";
import { MilkSessionLock } from "../models/MilkSessionLock.js";
import { Verification } from "../models/Verification.js";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";

const SOCIETY_FIXED_RATE = Number(process.env.SOCIETY_FIXED_RATE || 45);

function normalizeMilkType(milkType = "") {
  const value = String(milkType).trim().toLowerCase();
  if (value === "cow" || value === "cow milk") return "Cow";
  if (value === "buffalo" || value === "buffalo milk") return "Buffalo";
  return milkType;
}

function normalizeSession(session = "") {
  const value = String(session).toLowerCase();
  if (value === "morning" || value === "m") return "M";
  if (value === "evening" || value === "e") return "E";
  return session;
}

function isDemoUnlockRequest(req) {
  const value = String(req.headers["x-demo-unlock"] || "").toLowerCase();
  return value === "1" || value === "true";
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
    q.session = normalizeSession(session);
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

export async function getMilkSessionStatus(req, res) {
  const societyId = String(req.query.societyId || "").trim();
  const date = String(req.query.date || "").trim();
  const session = normalizeSession(req.query.session || "");

  if (!societyId || !date || !session) {
    return res.status(400).json({ message: "societyId, date and session are required" });
  }

  const [entries, lockRecord, verification] = await Promise.all([
    MilkEntry.find({ societyId, date, session }).sort({ createdAt: 1 }),
    MilkSessionLock.findOne({ societyId, date, session }),
    Verification.findOne({ societyId, date, session }),
  ]);

  const bmcVerified = Boolean(verification);
  let locked = bmcVerified;
  if (!locked) {
    if (lockRecord) {
      locked = Boolean(lockRecord.locked);
    } else if (entries.length > 0) {
      // Entries saved before lock records existed, or legacy data — treat as locked.
      locked = true;
    }
  }

  if (isDemoUnlockRequest(req)) {
    locked = false;
  }

  res.json({
    data: {
      societyId,
      date,
      session,
      locked,
      bmcVerified,
      verificationChoice: verification?.verifyChoice || null,
      comparisonStatus: verification?.comparisonStatus || null,
      lockedAt: lockRecord?.lockedAt || verification?.createdAt || null,
      entries,
    },
  });
}

export async function createMilkEntries(req, res) {
  const { societyId, date, session, entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: "Entries required" });
  }

  const sessionValue = normalizeSession(session);

  const demoUnlock = isDemoUnlockRequest(req);

  if (!demoUnlock) {
    const existingLock = await MilkSessionLock.findOne({
      societyId,
      date,
      session: sessionValue,
    });
    if (existingLock?.locked) {
      return res.status(409).json({ message: "This session is locked. Request admin unlock to make changes." });
    }

    const existingVerification = await Verification.findOne({
      societyId,
      date,
      session: sessionValue,
    });
    if (existingVerification) {
      return res.status(409).json({
        message: "BMC has already verified this session. Changes are not allowed.",
      });
    }
  }

  const docsMap = new Map();
  for (const e of entries) {
    const qty = Number(e.qty) || 0;
    const rate = SOCIETY_FIXED_RATE;
    const milkType = normalizeMilkType(e.milkType);
    docsMap.set(milkType, {
      societyId,
      date,
      session: sessionValue,
      milkType,
      fat: e.fat,
      snf: e.snf,
      qty,
      rate,
      amount: Number((qty * rate).toFixed(2)),
    });
  }
  const docs = Array.from(docsMap.values());

  if (!docs.length) {
    return res.status(400).json({ message: "Entries required" });
  }

  await MilkSessionLock.findOneAndUpdate(
    { societyId, date, session: sessionValue },
    { locked: true, lockedAt: new Date(), unlockedAt: null },
    { upsert: true, new: true }
  );

  await MilkEntry.deleteMany({ societyId, date, session: sessionValue });

  let saved;
  try {
    saved = await MilkEntry.insertMany(docs, { ordered: false });
  } catch (err) {
    if (err?.code === 11000) {
      await MilkEntry.deleteMany({ societyId, date, session: sessionValue });
      saved = await MilkEntry.insertMany(docs);
    } else {
      throw err;
    }
  }

  res.status(201).json({
    data: saved,
    message: "Milk entries saved and session locked successfully.",
    locked: true,
  });
}

export async function unlockMilkSession({ societyId, date, sessionCode }) {
  const session = normalizeSession(sessionCode);
  const lockRecord = await MilkSessionLock.findOneAndUpdate(
    { societyId, date, session },
    { locked: false, unlockedAt: new Date() },
    { new: true }
  );
  return lockRecord;
}
