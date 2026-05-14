import { MilkEntry } from "../models/MilkEntry.js";
import { Society } from "../models/Society.js";
import { Claims } from "../models/Claims.js";
import { Recoverables } from "../models/Recoverables.js";
import { SchemeBenefits } from "../models/SchemeBenefits.js";
import { SchemeDeduction } from "../models/SchemeDeduction.js";
import {
  AccountAuditLog,
  BillingCycle,
  BillingLineItem,
  Claim,
  Payment,
  Recoverable,
  RecoverableTransaction,
  Scheme,
  SocietyBilling,
} from "../models/accounts.js";
import { getDashboardMetrics, calculateNetPayable } from "../utils/billingCalculation.js";
import { buildCycleProgress } from "../utils/cycleProgress.js";

function sum(list, iteratee) {
  return list.reduce((total, item) => total + Number(iteratee(item) || 0), 0);
}

function roundMoney(value) {
  return Math.round(Number(value || 0));
}

async function getLiveCycleAdjustments(billingCycleId) {
  const [claims, schemeBenefits, schemeDeductions, recoverables] = await Promise.all([
    Claims.find({ billingCycleId, status: { $in: ["approved", "applied"] } }, "amount"),
    SchemeBenefits.find({ billingCycleId, status: { $in: ["approved", "applied"] } }, "amount"),
    SchemeDeduction.find({ billingCycleId, status: { $in: ["approved", "applied"] } }, "amount"),
    Recoverables.find({ status: "active" }, "amountPerCycle totalCycles appliedCycles"),
  ]);

  return {
    claims: sum(claims, (item) => item.amount),
    schemeBenefits: sum(schemeBenefits, (item) => item.amount),
    schemeDeductions: sum(schemeDeductions, (item) => item.amount),
    recoverables: sum(recoverables, (item) => {
      const appliedCycles = Array.isArray(item.appliedCycles) ? item.appliedCycles : [];
      if (appliedCycles.length >= Number(item.totalCycles || 0)) return 0;
      return item.amountPerCycle;
    }),
  };
}

function toDateOnly(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBillingCycleWindow(referenceValue = new Date()) {
  const referenceDate = referenceValue instanceof Date ? new Date(referenceValue) : new Date(referenceValue);
  if (Number.isNaN(referenceDate.getTime())) {
    throw new Error("Invalid billing cycle date.");
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  let startDay = 1;
  let endDay = 10;
  let cycleNumber = 1;

  if (day > 10 && day <= 20) {
    startDay = 11;
    endDay = 20;
    cycleNumber = 2;
  } else if (day > 20) {
    startDay = 21;
    endDay = lastDayOfMonth;
    cycleNumber = 3;
  }

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    code: `${monthKey}-C${cycleNumber}`,
    startDate: toDateOnly(new Date(year, month, startDay)),
    endDate: toDateOnly(new Date(year, month, endDay)),
    cycleNumber,
  };
}

function getWindowFromCycleCode(code = "") {
  const match = String(code).trim().match(/^(\d{4})-(\d{2})-C([123])$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const cycleNumber = Number(match[3]);
  if (!year || month < 1 || month > 12) return null;

  const zeroBasedMonth = month - 1;
  const lastDayOfMonth = new Date(year, zeroBasedMonth + 1, 0).getDate();
  const startDay = cycleNumber === 1 ? 1 : cycleNumber === 2 ? 11 : 21;
  const endDay = cycleNumber === 1 ? 10 : cycleNumber === 2 ? 20 : lastDayOfMonth;

  return {
    code: `${year}-${String(month).padStart(2, "0")}-C${cycleNumber}`,
    startDate: toDateOnly(new Date(year, zeroBasedMonth, startDay)),
    endDate: toDateOnly(new Date(year, zeroBasedMonth, endDay)),
    cycleNumber,
  };
}

function getUserLabel(req) {
  return req.user?.username || req.user?.id || "system";
}

function getUserRole(req) {
  return req.user?.role || "";
}

async function logAudit(req, action, entityType, entityId, details = {}) {
  try {
    await AccountAuditLog.create({
      action,
      entityType,
      entityId,
      performedBy: getUserLabel(req),
      performedRole: getUserRole(req),
      details,
    });
  } catch {
    // Audit logging should never break the financial workflow.
  }
}

async function findBillingCycle(identifier) {
  if (!identifier) return null;
  const query = [{ code: String(identifier) }];
  if (/^[a-f0-9]{24}$/i.test(String(identifier))) {
    query.push({ _id: identifier });
  }
  return BillingCycle.findOne({ $or: query });
}

function isSchemeApplicable(scheme, societyId) {
  const appliesTo = Array.isArray(scheme.appliesTo) ? scheme.appliesTo : [];
  return appliesTo.length === 0 || appliesTo.includes("ALL") || appliesTo.includes(societyId);
}

function passesCondition(scheme, summary) {
  if (!scheme.condition?.metric) return true;
  const metricValue = Number(summary?.[scheme.condition.metric] || 0);
  const threshold = Number(scheme.condition.threshold || 0);
  switch (scheme.condition.op) {
    case ">":
      return metricValue > threshold;
    case ">=":
      return metricValue >= threshold;
    case "<":
      return metricValue < threshold;
    case "<=":
      return metricValue <= threshold;
    default:
      return false;
  }
}

function calculateSchemeAmount(scheme, summary) {
  const qty = Number(summary.totalMilkQty || 0);
  if (scheme.calculationType === "PER_LITRE") return qty * Number(scheme.value || 0);
  if (scheme.calculationType === "FIXED") return Number(scheme.value || 0);
  if (scheme.calculationType === "CONDITION") return qty * Number(scheme.value || 0);
  return 0;
}

function buildPdfBuffer(lines) {
  const width = 595;
  const height = 842;
  const escapedLines = lines.map((line) => String(line).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")).slice(0, 45);
  const textOps = ["BT", "/F1 11 Tf", `1 0 0 1 48 ${height - 56} Tm`];

  escapedLines.forEach((line, index) => {
    if (index === 0) {
      textOps.push(`(${line}) Tj`);
    } else {
      textOps.push("T*");
      textOps.push(`(${line}) Tj`);
    }
  });

  textOps.push("ET");
  const content = textOps.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

async function ensureCycleStatus(cycle, allowedStatuses, message) {
  if (!cycle) {
    return { ok: false, status: 404, message: "Billing cycle not found." };
  }
  if (!allowedStatuses.includes(cycle.status)) {
    return { ok: false, status: 409, message };
  }
  return { ok: true };
}

async function calculateCycleBilling(req, cycle) {
  const entries = await MilkEntry.find({ date: { $gte: cycle.startDate, $lte: cycle.endDate } });
  const societies = await Society.find({}, "societyId societyName district");
  const societiesById = new Map(societies.map((society) => [society.societyId, society]));
  const schemes = await Scheme.find({ isActive: true });
  const cycleClaims = await Claim.find({ billingCycleId: String(cycle._id) });
  const recoverables = await Recoverable.find({ status: "ACTIVE", remainingAmount: { $gt: 0 } });

  await SocietyBilling.deleteMany({ billingCycleId: String(cycle._id) });
  await BillingLineItem.deleteMany({ billingCycleId: String(cycle._id) });
  await Payment.deleteMany({ billingCycleId: String(cycle._id) });

  const bySociety = new Map();
  for (const entry of entries) {
    const key = entry.societyId;
    const bucket = bySociety.get(key) || {
      societyId: key,
      totalMilkQty: 0,
      milkAmount: 0,
      totalFatWeighted: 0,
      totalSnfWeighted: 0,
      transportPenalty: 0,
      entries: [],
    };

    const qty = Number(entry.qty || 0);
    bucket.totalMilkQty += qty;
    bucket.milkAmount += Number(entry.amount || 0);
    bucket.totalFatWeighted += Number(entry.fat || 0) * qty;
    bucket.totalSnfWeighted += Number(entry.snf || 0) * qty;
    bucket.transportPenalty += Number(entry.transportPenalty || 0);
    bucket.entries.push(entry);
    bySociety.set(key, bucket);
  }

  const billingRows = [];

  for (const bucket of bySociety.values()) {
    const summary = {
      totalMilkQty: bucket.totalMilkQty,
      milkAmount: bucket.milkAmount,
      averageFat: bucket.totalMilkQty > 0 ? bucket.totalFatWeighted / bucket.totalMilkQty : 0,
      averageSnf: bucket.totalMilkQty > 0 ? bucket.totalSnfWeighted / bucket.totalMilkQty : 0,
      transportPenalty: bucket.transportPenalty,
    };

    const societyClaims = cycleClaims.filter((claim) => claim.societyId === bucket.societyId && claim.status === "APPLIED");
    const activeRecoverables = recoverables.filter((recoverable) => recoverable.societyId === bucket.societyId);
    const applicableSchemes = schemes.filter((scheme) => isSchemeApplicable(scheme, bucket.societyId) && passesCondition(scheme, summary));

    let totalClaims = 0;
    let totalRecoverables = 0;
    let totalSchemeDeductions = 0;
    let totalSchemeBenefits = 0;
    const lineItems = [];

    lineItems.push({ type: "MILK", referenceId: "", amount: roundMoney(summary.milkAmount), description: "Milk amount" });

    for (const claim of societyClaims) {
      const claimAmount = roundMoney(claim.amount);
      totalClaims += claimAmount;
      lineItems.push({ type: "CLAIM", referenceId: String(claim._id), amount: claimAmount, description: claim.type });
    }

    for (const recoverable of activeRecoverables) {
      const installment = Math.min(Number(recoverable.installmentAmount || 0), Number(recoverable.remainingAmount || 0));
      if (installment <= 0) continue;
      totalRecoverables += installment;
      lineItems.push({
        type: "RECOVERABLE",
        referenceId: String(recoverable._id),
        amount: -roundMoney(installment),
        description: recoverable.reason,
      });
    }

    for (const scheme of applicableSchemes) {
      const amount = roundMoney(calculateSchemeAmount(scheme, summary));
      if (amount <= 0) continue;
      if (scheme.type === "DEDUCTION") {
        totalSchemeDeductions += amount;
        lineItems.push({ type: "SCHEME", referenceId: String(scheme._id), amount: -amount, description: scheme.name });
      } else {
        totalSchemeBenefits += amount;
        lineItems.push({ type: "SCHEME", referenceId: String(scheme._id), amount, description: scheme.name });
      }
    }

    const transportPenalty = roundMoney(summary.transportPenalty);
    if (transportPenalty > 0) {
      lineItems.push({ type: "PENALTY", referenceId: "", amount: -transportPenalty, description: "Transport penalty" });
    }

    const netPayable = Math.max(
      0,
      roundMoney(
        summary.milkAmount + totalClaims + totalSchemeBenefits - totalRecoverables - totalSchemeDeductions - transportPenalty
      )
    );

    const billing = await SocietyBilling.create({
      societyId: bucket.societyId,
      billingCycleId: String(cycle._id),
      totalMilkQty: roundMoney(summary.totalMilkQty),
      milkAmount: roundMoney(summary.milkAmount),
      totalClaims: roundMoney(totalClaims),
      totalRecoverables: roundMoney(totalRecoverables),
      totalSchemeDeductions: roundMoney(totalSchemeDeductions),
      totalSchemeBenefits: roundMoney(totalSchemeBenefits),
      transportPenalty,
      netPayable,
      averageFat: Number(summary.averageFat.toFixed(2)),
      averageSnf: Number(summary.averageSnf.toFixed(2)),
      status: cycle.status === "LOCKED" || cycle.status === "PAID" ? cycle.status : "CALCULATED",
    });

    await BillingLineItem.insertMany(
      lineItems.map((item) => ({
        ...item,
        societyBillingId: String(billing._id),
        billingCycleId: String(cycle._id),
        societyId: bucket.societyId,
      }))
    );

    billingRows.push({
      billing,
      society: societiesById.get(bucket.societyId) || null,
      lineItems,
    });
  }

  cycle.status = "CALCULATED";
  cycle.reviewedBy = getUserLabel(req);
  await cycle.save();

  return billingRows;
}

function cycleProgressStatus() {
  return buildCycleProgress(new Date()).map((item) => ({
    cycle: item.cycle,
    range: item.range,
    status: item.status,
  }));
}

export async function getAccountsDashboard(req, res) {
  const cycleIdentifier = req.query.cycleId || req.query.billingCycleId || "";
  const cycle = cycleIdentifier ? await findBillingCycle(cycleIdentifier) : await BillingCycle.findOne().sort({ createdAt: -1 });
  const billingCycleKey = cycle ? String(cycle._id) : String(cycleIdentifier || "");

  const fallbackWindow = getWindowFromCycleCode(cycleIdentifier) || getBillingCycleWindow(new Date());
  const activeCycle = cycle
    ? {
        id: String(cycle._id),
        code: cycle.code,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
      }
    : {
        id: "",
        code: fallbackWindow.code,
        startDate: fallbackWindow.startDate,
        endDate: fallbackWindow.endDate,
        status: "OPEN",
      };

  let billingRows = cycle ? await SocietyBilling.find({ billingCycleId: String(cycle._id) }) : [];
  if (cycle && !billingRows.length && ["OPEN", "CALCULATED"].includes(cycle.status)) {
    try {
      await calculateCycleBilling(req, cycle);
      billingRows = await SocietyBilling.find({ billingCycleId: String(cycle._id) });
    } catch {
      billingRows = [];
    }
  }
  const pendingCycles = await BillingCycle.countDocuments({ status: "OPEN" });
  const cycleEntries = await MilkEntry.find({ date: { $gte: activeCycle.startDate, $lte: activeCycle.endDate } });

  // Get all societies for this cycle
  const societies = await Society.find();
  const societyIds = societies.map((s) => s.societyId);

  // If we have stored SocietyBilling rows for this cycle, derive metrics from them
  let metrics;
  if (billingRows && billingRows.length) {
    const societyCount = societyIds.length || billingRows.length;
    const totalMilkValue = sum(billingRows, (row) => Number(row.milkAmount || 0));
    const liveAdjustments = await getLiveCycleAdjustments(String(cycle._id));
    const storedClaims = sum(billingRows, (row) => Number(row.totalClaims || 0));
    const storedSchemeBenefits = sum(billingRows, (row) => Number(row.totalSchemeBenefits || 0));
    const storedRecoverables = sum(billingRows, (row) => Number(row.totalRecoverables || 0));
    const storedSchemeDeductions = sum(billingRows, (row) => Number(row.totalSchemeDeductions || 0));
    const totalClaims = liveAdjustments.claims || storedClaims;
    const totalSchemeBenefits = liveAdjustments.schemeBenefits || storedSchemeBenefits;
    const totalRecoverables = liveAdjustments.recoverables || storedRecoverables;
    const totalSchemeDeductions = liveAdjustments.schemeDeductions || storedSchemeDeductions;
    const totalPayable = roundMoney(totalMilkValue + totalClaims * societyCount + totalSchemeBenefits * societyCount);
    const totalDeductions = roundMoney((totalRecoverables + totalSchemeDeductions) * societyCount);
    const netPayable = roundMoney(totalPayable - totalDeductions);

    metrics = {
      totalMilkValue: roundMoney(totalMilkValue),
      totalPayable,
      totalDeductions,
      netPayable,
      breakdown: {
        additions: {
          milkValue: roundMoney(totalMilkValue),
          claims: roundMoney(totalClaims * societyCount),
          schemeBenefits: roundMoney(totalSchemeBenefits * societyCount),
        },
        deductions: { recoverables: roundMoney(totalRecoverables * societyCount), schemeDeductions: roundMoney(totalSchemeDeductions * societyCount) },
      },
    };
  } else {
    // Use new billing calculation across raw data
    metrics = await getDashboardMetrics(
      billingCycleKey,
      activeCycle.startDate,
      activeCycle.endDate,
      societyIds
    );
  }

  const milkCow = sum(cycleEntries, (entry) => (entry.milkType === "Cow" ? entry.qty : 0));
  const milkBuffalo = sum(cycleEntries, (entry) => (entry.milkType === "Buffalo" ? entry.qty : 0));

  const recentCycles = await BillingCycle.find().sort({ createdAt: -1 }).limit(6);
  const revenueTrend = [];
  for (const item of recentCycles.reverse()) {
    const rows = await SocietyBilling.find({ billingCycleId: String(item._id) });
    revenueTrend.push({ cycle: item.code, value: sum(rows, (row) => row.netPayable) });
  }

  res.json({
    data: {
      cycle: {
        id: activeCycle.id,
        code: activeCycle.code,
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        status: activeCycle.status,
      },
      cards: {
        totalMilkQty: metrics.totalMilkValue,
        totalPayable: metrics.totalPayable,
        totalDeductions: metrics.totalDeductions,
        netPayout: metrics.netPayable,
        pendingCycles,
      },
      breakdown: metrics.breakdown,
      milkDistribution: [
        { name: "Cow Milk", value: roundMoney(milkCow) },
        { name: "Buffalo Milk", value: roundMoney(milkBuffalo) },
      ],
      revenueTrend,
      cycleProgress: cycleProgressStatus(),
    },
  });
}

export async function listBillingCycles(req, res) {
  const cycles = await BillingCycle.find().sort({ createdAt: -1 });
  res.json({ data: cycles });
}

export async function createBillingCycle(req, res) {
  try {
    const referenceDate = req.body.date || req.body.startDate || req.body.endDate || new Date();
    const window = getBillingCycleWindow(referenceDate);

    const existing = await findBillingCycle(window.code);
    if (existing) {
      return res.status(409).json({ message: `Billing cycle ${window.code} already exists.` });
    }

    const next = await BillingCycle.create({
      code: window.code,
      startDate: window.startDate,
      endDate: window.endDate,
      status: req.body.status || "OPEN",
      createdBy: getUserLabel(req),
    });
    await logAudit(req, "CREATE_BILLING_CYCLE", "BillingCycle", String(next._id), { code: next.code, window: `${window.startDate} to ${window.endDate}` });
    res.status(201).json({ data: next });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to create billing cycle." });
  }
}

export async function runBillingCycle(req, res) {
  const cycle = await findBillingCycle(req.params.id);
  const statusCheck = await ensureCycleStatus(cycle, ["OPEN", "CALCULATED"], "Only open or calculated cycles can be recalculated.");
  if (!statusCheck.ok) return res.status(statusCheck.status).json({ message: statusCheck.message });

  const billingRows = await calculateCycleBilling(req, cycle);
  await logAudit(req, "RUN_BILLING", "BillingCycle", String(cycle._id), { rows: billingRows.length });
  res.json({ message: `Billing calculated for cycle ${cycle.code}.`, data: billingRows.map((row) => row.billing) });
}

export async function lockBillingCycle(req, res) {
  const cycle = await findBillingCycle(req.params.id);
  if (!cycle) return res.status(404).json({ message: "Billing cycle not found." });
  if (cycle.status === "PAID") return res.status(409).json({ message: "Cycle already paid." });

  let billingRows = await SocietyBilling.find({ billingCycleId: String(cycle._id) });
  if (!billingRows.length) {
    billingRows = await calculateCycleBilling(req, cycle).then((rows) => rows.map((row) => row.billing));
  }

  cycle.status = "LOCKED";
  await cycle.save();
  await SocietyBilling.updateMany({ billingCycleId: String(cycle._id) }, { $set: { status: "LOCKED", lockedAt: new Date() } });

  await logAudit(req, "LOCK_BILLING_CYCLE", "BillingCycle", String(cycle._id), { billingRows: billingRows.length });
  res.json({ message: `Cycle ${cycle.code} locked successfully.`, data: { id: String(cycle._id), status: cycle.status } });
}

export async function disburseBillingCycle(req, res) {
  const cycle = await findBillingCycle(req.params.id);
  if (!cycle) return res.status(404).json({ message: "Billing cycle not found." });
  if (cycle.status !== "LOCKED") return res.status(409).json({ message: "Only locked cycles can be disbursed." });

  const billings = await SocietyBilling.find({ billingCycleId: String(cycle._id) });
  if (!billings.length) return res.status(400).json({ message: "No billing records found for this cycle." });

  const results = [];

  for (const billing of billings) {
    const existingPayment = await Payment.findOne({ billingCycleId: String(cycle._id), societyId: billing.societyId, status: "SUCCESS" });
    if (!existingPayment) {
      await Payment.create({
        societyId: billing.societyId,
        billingCycleId: String(cycle._id),
        amount: billing.netPayable,
        status: "SUCCESS",
        transactionRef: `TXN-${String(Date.now()).slice(-8)}-${billing.societyId}`,
        createdBy: getUserLabel(req),
      });
    }

    const lineItems = await BillingLineItem.find({ societyBillingId: String(billing._id) });
    const recoverableItems = lineItems.filter((item) => item.type === "RECOVERABLE" && Number(item.amount || 0) < 0);

    for (const item of recoverableItems) {
      const recoverable = await Recoverable.findById(item.referenceId);
      if (!recoverable) continue;
      const deduct = Math.min(Math.abs(Number(item.amount || 0)), Number(recoverable.remainingAmount || 0));
      if (deduct <= 0) continue;

      recoverable.remainingAmount = Number(recoverable.remainingAmount || 0) - deduct;
      if (recoverable.remainingAmount <= 0) {
        recoverable.remainingAmount = 0;
        recoverable.status = "CLOSED";
      }
      await recoverable.save();

      await RecoverableTransaction.create({
        recoverableId: String(recoverable._id),
        billingCycleId: String(cycle._id),
        societyId: billing.societyId,
        deductedAmount: deduct,
        createdBy: getUserLabel(req),
      });
    }

    billing.status = "PAID";
    billing.paidAt = new Date();
    await billing.save();

    results.push({ societyId: billing.societyId, netPayable: billing.netPayable });
  }

  cycle.status = "PAID";
  await cycle.save();

  await logAudit(req, "DISBURSE_BILLING_CYCLE", "BillingCycle", String(cycle._id), { paidRows: results.length });
  res.json({ message: `Cycle ${cycle.code} disbursed successfully.`, data: results });
}

export async function getBillingSummary(req, res) {
  const cycle = await findBillingCycle(req.params.cycleId);
  if (!cycle) return res.status(404).json({ message: "Billing cycle not found." });

  const billings = await SocietyBilling.find({ billingCycleId: String(cycle._id) }).sort({ societyId: 1 });
  const lineItems = await BillingLineItem.find({ billingCycleId: String(cycle._id) }).sort({ societyId: 1, createdAt: 1 });

  res.json({
    data: {
      cycle,
      billings,
      lineItems,
    },
  });
}

export async function getSocietyBilling(req, res) {
  const cycle = await findBillingCycle(req.params.cycleId);
  if (!cycle) return res.status(404).json({ message: "Billing cycle not found." });

  const billing = await SocietyBilling.findOne({ billingCycleId: String(cycle._id), societyId: req.params.societyId });
  if (!billing) return res.status(404).json({ message: "Society billing not found." });

  const society = await Society.findOne({ societyId: req.params.societyId }, "societyId societyName district bmcId route");
  const lineItems = await BillingLineItem.find({ societyBillingId: String(billing._id) }).sort({ createdAt: 1 });
  const societyCount = await Society.countDocuments();

  // Get detailed payable breakdown using new calculation utility
  const payableData = await calculateNetPayable(
    req.params.societyId,
    String(cycle._id),
    cycle.startDate,
    cycle.endDate,
    1
  );

  res.json({
    data: {
      cycle,
      society,
      billing,
      lineItems,
      payableBreakdown: payableData,
    },
  });
}

export async function listSchemes(req, res) {
  const schemes = await Scheme.find().sort({ createdAt: -1 });
  res.json({ data: schemes });
}

export async function createScheme(req, res) {
  const next = await Scheme.create({
    ...req.body,
    createdBy: getUserLabel(req),
  });
  await logAudit(req, "CREATE_SCHEME", "Scheme", String(next._id), { name: next.name });
  res.status(201).json({ data: next });
}

export async function toggleScheme(req, res) {
  const scheme = await Scheme.findById(req.params.id);
  if (!scheme) return res.status(404).json({ message: "Scheme not found." });

  scheme.isActive = !scheme.isActive;
  scheme.updatedBy = getUserLabel(req);
  await scheme.save();
  await logAudit(req, "TOGGLE_SCHEME", "Scheme", String(scheme._id), { isActive: scheme.isActive });
  res.json({ data: scheme });
}

export async function assignScheme(req, res) {
  const scheme = await Scheme.findById(req.params.id);
  if (!scheme) return res.status(404).json({ message: "Scheme not found." });

  const societyIds = Array.isArray(req.body.societyIds)
    ? req.body.societyIds
    : req.body.societyId
      ? [req.body.societyId]
      : [];
  const isEnabled = req.body.isEnabled !== false;
  const current = new Set(Array.isArray(scheme.appliesTo) ? scheme.appliesTo : []);

  for (const societyId of societyIds) {
    if (isEnabled) current.add(societyId);
    else current.delete(societyId);
  }

  scheme.appliesTo = Array.from(current);
  scheme.updatedBy = getUserLabel(req);
  await scheme.save();
  await logAudit(req, "ASSIGN_SCHEME", "Scheme", String(scheme._id), { societyIds, isEnabled });
  res.json({ data: scheme });
}

export async function listClaims(req, res) {
  const filter = {};
  if (req.query.societyId) filter.societyId = req.query.societyId;
  if (req.query.billingCycleId) filter.billingCycleId = req.query.billingCycleId;
  const claims = await Claim.find(filter).sort({ createdAt: -1 });
  res.json({ data: claims });
}

export async function createClaim(req, res) {
  const next = await Claim.create({
    ...req.body,
    createdBy: getUserLabel(req),
  });
  await logAudit(req, "CREATE_CLAIM", "Claim", String(next._id), { societyId: next.societyId, amount: next.amount });
  res.status(201).json({ data: next });
}

export async function listRecoverables(req, res) {
  const filter = {};
  if (req.query.societyId) filter.societyId = req.query.societyId;
  const recoverables = await Recoverable.find(filter).sort({ createdAt: -1 });
  res.json({ data: recoverables });
}

export async function createRecoverable(req, res) {
  const next = await Recoverable.create({
    ...req.body,
    remainingAmount: Number(req.body.remainingAmount ?? req.body.totalAmount ?? 0),
    createdBy: getUserLabel(req),
  });
  await logAudit(req, "CREATE_RECOVERABLE", "Recoverable", String(next._id), { societyId: next.societyId, totalAmount: next.totalAmount });
  res.status(201).json({ data: next });
}

function renderInvoiceLines(invoice) {
  const { cycle, society, billing, lineItems } = invoice;
  return [
    "RBKVMUL Accounts Invoice",
    `Society: ${society?.societyName || billing.societyId}`,
    `Society ID: ${billing.societyId}`,
    `District: ${society?.district || "-"}`,
    `Cycle: ${cycle.code} (${cycle.startDate} to ${cycle.endDate})`,
    `Status: ${billing.status}`,
    "",
    `Milk Amount: ${billing.milkAmount}`,
    `Claims: ${billing.totalClaims}`,
    `Recoverables: ${billing.totalRecoverables}`,
    `Scheme Deductions: ${billing.totalSchemeDeductions}`,
    `Scheme Benefits: ${billing.totalSchemeBenefits}`,
    `Net Payable: ${billing.netPayable}`,
    "",
    "Breakdown:",
    ...lineItems.map((item) => `${item.type} | ${item.description || "-"} | ${item.amount}`),
  ];
}

async function loadInvoice(societyBillingId) {
  const billing = await SocietyBilling.findById(societyBillingId);
  if (!billing) return null;
  const cycle = await BillingCycle.findById(billing.billingCycleId);
  const society = await Society.findOne({ societyId: billing.societyId }, "societyId societyName district bmcId route");
  const lineItems = await BillingLineItem.find({ societyBillingId: String(billing._id) }).sort({ createdAt: 1 });
  return { cycle, society, billing, lineItems };
}

export async function getInvoice(req, res) {
  const invoice = await loadInvoice(req.params.societyBillingId);
  if (!invoice) return res.status(404).json({ message: "Invoice not found." });
  res.json({ data: invoice });
}

export async function getInvoicePdf(req, res) {
  const invoice = await loadInvoice(req.params.societyBillingId);
  if (!invoice) return res.status(404).json({ message: "Invoice not found." });

  const pdf = buildPdfBuffer(renderInvoiceLines(invoice));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.billing.societyId}-${invoice.cycle.code}.pdf`);
  res.send(pdf);
}

export async function payoutReport(req, res) {
  const { cycleId, societyId } = req.query;
  const filter = {};
  if (cycleId) filter.billingCycleId = cycleId;
  if (societyId) filter.societyId = societyId;
  const billings = await SocietyBilling.find(filter).sort({ createdAt: -1 });

  res.json({
    data: billings.map((billing) => ({
      societyId: billing.societyId,
      billingCycleId: billing.billingCycleId,
      netPayable: billing.netPayable,
      totalMilkQty: billing.totalMilkQty,
      totalClaims: billing.totalClaims,
      totalRecoverables: billing.totalRecoverables,
      totalSchemeDeductions: billing.totalSchemeDeductions,
      totalSchemeBenefits: billing.totalSchemeBenefits,
      status: billing.status,
    })),
  });
}

export async function deductionsReport(req, res) {
  const { cycleId, societyId } = req.query;
  const filter = {};
  if (cycleId) filter.billingCycleId = cycleId;
  if (societyId) filter.societyId = societyId;
  const billings = await SocietyBilling.find(filter).sort({ createdAt: -1 });

  res.json({
    data: billings.map((billing) => ({
      societyId: billing.societyId,
      cycleId: billing.billingCycleId,
      recoverables: billing.totalRecoverables,
      schemeDeductions: billing.totalSchemeDeductions,
      totalDeductions: billing.totalRecoverables + billing.totalSchemeDeductions,
    })),
  });
}

export async function schemesReport(req, res) {
  const schemes = await Scheme.find().sort({ createdAt: -1 });
  res.json({
    data: schemes.map((scheme) => ({
      id: String(scheme._id),
      name: scheme.name,
      type: scheme.type,
      calculationType: scheme.calculationType,
      value: scheme.value,
      isActive: scheme.isActive,
      appliesTo: scheme.appliesTo,
    })),
  });
}

export async function transportPenaltyReport(req, res) {
  const filter = {};
  if (req.query.societyId) filter.societyId = req.query.societyId;
  if (req.query.cycleId) {
    const cycle = await findBillingCycle(req.query.cycleId);
    if (!cycle) return res.status(404).json({ message: "Billing cycle not found." });
    filter.billingCycleId = String(cycle._id);
  }

  const billings = await SocietyBilling.find(filter).sort({ createdAt: -1 });
  res.json({
    data: billings.map((billing) => ({
      societyId: billing.societyId,
      billingCycleId: billing.billingCycleId,
    })),
  });
}

export async function accountsReportSummary(req, res) {
  const cycles = await BillingCycle.find().sort({ createdAt: -1 }).limit(6);
  const cycleId = req.query.cycleId || req.query.billingCycleId || cycles[0]?._id;
  const selectedCycle = cycleId ? await findBillingCycle(cycleId) : null;
  const billings = selectedCycle ? await SocietyBilling.find({ billingCycleId: String(selectedCycle._id) }) : [];
  const billingCycleKey = selectedCycle ? String(selectedCycle._id) : String(cycleId || "");
  const societyCount = billings.length || (await Society.countDocuments());
  const totalMilkValue = sum(billings, (row) => Number(row.milkAmount || 0));
  const liveAdjustments = billingCycleKey ? await getLiveCycleAdjustments(billingCycleKey) : null;
  const storedClaims = sum(billings, (row) => Number(row.totalClaims || 0));
  const storedSchemeBenefits = sum(billings, (row) => Number(row.totalSchemeBenefits || 0));
  const storedRecoverables = sum(billings, (row) => Number(row.totalRecoverables || 0));
  const storedSchemeDeductions = sum(billings, (row) => Number(row.totalSchemeDeductions || 0));
  const totalClaims = liveAdjustments?.claims || storedClaims;
  const totalSchemeBenefits = liveAdjustments?.schemeBenefits || storedSchemeBenefits;
  const totalPayable = totalMilkValue + totalClaims * societyCount + totalSchemeBenefits * societyCount;
  const totalDeductions = ((liveAdjustments?.recoverables || storedRecoverables) + (liveAdjustments?.schemeDeductions || storedSchemeDeductions)) * societyCount;

  res.json({
    data: {
      cycles: cycles.map((cycle) => ({ id: String(cycle._id), code: cycle.code, status: cycle.status })),
      summary: selectedCycle
        ? {
            cycleId: String(selectedCycle._id),
            code: selectedCycle.code,
            status: selectedCycle.status,
            totalPayable: roundMoney(totalPayable),
            totalDeductions: roundMoney(totalDeductions),
            netPayout: roundMoney(Math.max(0, totalPayable - totalDeductions)),
          }
        : null,
    },
  });
}
