import { MilkEntry } from "../models/MilkEntry.js";
import { Society } from "../models/Society.js";
import { TankerShipment } from "../models/TankerShipment.js";
import { User } from "../models/User.js";
import { Verification } from "../models/Verification.js";

const PENALTY_RATE_PER_L = 35;
const QUALITY_DEFAULTS = [
  { parameter: "Fat", routeSheet: "4.2", dairyTest: "4.1" },
  { parameter: "SNF", routeSheet: "8.7", dairyTest: "8.6" },
  { parameter: "Temperature", routeSheet: "5°C", dairyTest: "5°C" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeShipment(doc) {
  if (!doc) return null;
  const item = doc.toObject ? doc.toObject() : doc;
  return {
    ...item,
    id: String(item._id),
    stops: (item.stops || []).map((stop) => ({
      ...stop,
      shortage: Math.max(Number(stop.expected || 0) - Number(stop.received || 0), 0),
    })),
  };
}

function calculateTotals(stops = []) {
  return stops.reduce(
    (acc, stop) => {
      const expected = Number(stop.expected || 0);
      const received = Number(stop.received || 0);
      const shortage = Math.max(expected - received, 0);
      return {
        expected: acc.expected + expected,
        received: acc.received + received,
        shortage: acc.shortage + shortage,
      };
    },
    { expected: 0, received: 0, shortage: 0 }
  );
}

async function applyTransportPenalties(shipment, deductionTotal) {
  const stops = shipment.stops || [];
  const totals = calculateTotals(stops);
  if (totals.shortage <= 0 || deductionTotal <= 0) return;

  const societies = await Society.find({}, "societyId societyName bmcId district").lean();
  const date = shipment.receivedDate || todayIso();

  for (const stop of stops) {
    const shortage = Math.max(Number(stop.expected || 0) - Number(stop.received || 0), 0);
    if (shortage <= 0) continue;

    const share = totals.shortage > 0 ? shortage / totals.shortage : 0;
    const penalty = Math.round(deductionTotal * share);

    const matchedSocieties = societies.filter((s) => {
      const bmcLabel = String(stop.bmc || "").trim().toLowerCase();
      const societyBmc = String(s.bmcId || s.societyName || "").trim().toLowerCase();
      return societyBmc && bmcLabel.includes(societyBmc) || societyBmc.includes(bmcLabel.replace(/\s*bmc/i, "").trim());
    });

    const targets = matchedSocieties.length ? matchedSocieties : societies.slice(0, 1);
    const perSociety = Math.round(penalty / targets.length);

    for (const society of targets) {
      await MilkEntry.updateMany(
        { societyId: society.societyId, date },
        { $inc: { transportPenalty: perSociety } }
      );
    }
  }
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveDairyUnitLabel({ dairyUnit = "", dairyId = "" } = {}) {
  const unit = String(dairyUnit || "").trim();
  if (unit) return unit;

  const userId = String(dairyId || "").trim();
  if (!userId) return "";

  const dairyUser = await User.findOne({ username: userId, role: "Dairy" }, "username profile").lean();
  return String(dairyUser?.profile?.dairyName || dairyUser?.profile?.dairyId || "").trim();
}

export async function listShipments(req, res) {
  const date = String(req.query.date || "").trim() || todayIso();
  const dairyId = String(req.query.dairyId || req.user?.username || "").trim();
  const dairyUnit = await resolveDairyUnitLabel({
    dairyUnit: req.query.dairyUnit,
    dairyId,
  });

  const query = { receivedDate: date };
  if (dairyUnit) query.dairyUnit = new RegExp(escapeRegExp(dairyUnit), "i");

  let shipments = await TankerShipment.find(query).sort({ createdAt: -1 });
  if (!shipments.length) {
    await seedShipmentsForDate(date, dairyUnit);
    shipments = await TankerShipment.find(query).sort({ createdAt: -1 });
  }

  res.json({ data: shipments.map(normalizeShipment) });
}

export async function getShipment(req, res) {
  const shipment = await TankerShipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ message: "Shipment not found." });
  res.json({ data: normalizeShipment(shipment) });
}

export async function updateShipment(req, res) {
  const shipment = await TankerShipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ message: "Shipment not found." });

  if (["approved", "penalty", "rejected"].includes(shipment.status)) {
    return res.status(409).json({ message: "Shipment is finalized and cannot be edited." });
  }

  const { stops, quality, status, arrivalTime, transporter } = req.body || {};
  if (Array.isArray(stops)) shipment.stops = stops;
  if (Array.isArray(quality)) shipment.quality = quality;
  if (status) shipment.status = status;
  if (arrivalTime) shipment.arrivalTime = arrivalTime;
  if (transporter) shipment.transporter = transporter;

  await shipment.save();
  res.json({ data: normalizeShipment(shipment) });
}

export async function finalizeShipment(req, res) {
  const shipment = await TankerShipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ message: "Shipment not found." });

  if (["approved", "penalty", "rejected"].includes(shipment.status)) {
    return res.status(409).json({ message: "Shipment already finalized." });
  }

  const { decision, discrepancy } = req.body || {};
  const totals = calculateTotals(shipment.stops || []);

  if (decision === "approved") {
    shipment.status = "approved";
    shipment.discrepancy = null;
  } else if (decision === "penalty") {
    const deduction =
      Number(discrepancy?.deduction) ||
      Math.round(totals.shortage * Number(discrepancy?.penaltyRate || PENALTY_RATE_PER_L));
    shipment.status = "penalty";
    shipment.discrepancy = {
      type: discrepancy?.type || "Quantity Loss",
      remarks: discrepancy?.remarks || "",
      evidenceName: discrepancy?.evidenceName || "",
      penaltyRate: Number(discrepancy?.penaltyRate || PENALTY_RATE_PER_L),
      deduction,
    };
    await applyTransportPenalties(shipment, deduction);
  } else if (decision === "rejected") {
    shipment.status = "rejected";
    shipment.discrepancy = {
      type: discrepancy?.type || "Rejected",
      remarks: discrepancy?.remarks || "",
      evidenceName: discrepancy?.evidenceName || "",
      penaltyRate: 0,
      deduction: 0,
    };
  } else {
    return res.status(400).json({ message: "Invalid decision." });
  }

  shipment.approvedBy = req.user?.username || String(req.user?.id || "dairy");
  await shipment.save();

  res.json({
    message: `Tanker ${shipment.tankerId} marked as ${shipment.status}.`,
    data: normalizeShipment(shipment),
  });
}

async function seedShipmentsForDate(date, dairyUnit = "") {
  const unitLabel = String(dairyUnit || "Ballari Dairy").trim();
  const existing = await TankerShipment.findOne({
    receivedDate: date,
    dairyUnit: new RegExp(`^${escapeRegExp(unitLabel)}$`, "i"),
  });
  if (existing) return;

  const societies = await Society.find({}, "societyId societyName bmcId district route").lean();
  if (!societies.length) return;

  const bmcMap = new Map();
  for (const society of societies) {
    const bmcKey = society.bmcId || society.societyName || "BMC";
    if (!bmcMap.has(bmcKey)) {
      bmcMap.set(bmcKey, {
        bmc: `${bmcKey} BMC`,
        bmcId: society.bmcId || "",
        societies: 0,
        milkType: "Cow",
        expected: 0,
      });
    }
    const bucket = bmcMap.get(bmcKey);
    bucket.societies += 1;
  }

  const verifications = await Verification.find({ date }).lean();
  const verifiedSocietyIds = new Set(verifications.map((v) => v.societyId));

  for (const society of societies) {
    const bmcKey = society.bmcId || society.societyName || "BMC";
    const bucket = bmcMap.get(bmcKey);
    if (!bucket) continue;

    const entries = await MilkEntry.find({ societyId: society.societyId, date }).lean();
    const qty = entries.reduce((sum, e) => sum + Number(e.qty || 0), 0);
    if (qty > 0 || verifiedSocietyIds.has(society.societyId)) {
      bucket.expected += qty;
      if (entries[0]?.milkType) bucket.milkType = entries[0].milkType;
    }
  }

  const stops = Array.from(bmcMap.values())
    .filter((stop) => stop.expected > 0)
    .map((stop) => ({
      ...stop,
      received: stop.expected,
    }));

  if (!stops.length) {
    stops.push(
      { bmc: "Ballari BMC", bmcId: "BMC_001", societies: 22, milkType: "Cow", expected: 2500, received: 2500 },
      { bmc: "Hospet BMC", bmcId: "BMC_001", societies: 18, milkType: "Buffalo", expected: 1700, received: 1700 },
      { bmc: "Siruguppa BMC", bmcId: "BMC_001", societies: 15, milkType: "Cow", expected: 800, received: 800 }
    );
  }

  await TankerShipment.create({
    tankerId: "T102",
    route: "Route-01",
    dairyUnit: unitLabel,
    arrivalTime: "6:10 AM",
    transporter: "Ramesh Logistics",
    shift: "Morning",
    receivedDate: date,
    status: "pending",
    stops,
    quality: QUALITY_DEFAULTS.map((row) => ({ ...row })),
  });
}

export async function getDairyReports(req, res) {
  const from = String(req.query.from || "").trim() || todayIso();
  const to = String(req.query.to || "").trim() || from;
  const shipments = await TankerShipment.find({ receivedDate: { $gte: from, $lte: to } }).sort({ receivedDate: -1 });

  const summary = shipments.map((item) => {
    const totals = calculateTotals(item.stops || []);
    return {
      id: String(item._id),
      date: item.receivedDate,
      tankerId: item.tankerId,
      route: item.route,
      status: item.status,
      expected: totals.expected,
      received: totals.received,
      shortage: totals.shortage,
      deduction: Number(item.discrepancy?.deduction || 0),
    };
  });

  res.json({ data: { summary, shipments: shipments.map(normalizeShipment) } });
}
