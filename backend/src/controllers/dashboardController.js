import { MilkEntry } from "../models/MilkEntry.js";
import { Society } from "../models/Society.js";
import { SocietyBilling } from "../models/accounts.js";
import { Verification } from "../models/Verification.js";
import { isGoodQualityByThreshold } from "../utils/quality.js";

function toDateStr(d = new Date()) {
  return d.toISOString().split("T")[0];
}

function monthLabel(d) {
  return d.toLocaleString("en-US", { month: "short" });
}

function lastMonths(count = 3) {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: monthLabel(d) });
  }
  return out;
}

function monthBucketsBetween(fromDate, toDate) {
  const out = [];
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return out;
  }

  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: `${monthLabel(cursor)} ${cursor.getFullYear()}` });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return out;
}

function sumBy(list, pred) {
  return list.reduce((s, v) => s + (pred(v) || 0), 0);
}

function round(value, digits = 2) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(digits));
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isoDate(date) {
  return date.toISOString().split("T")[0];
}

function buildRecentMonths(count = 6) {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel(d),
      date: d,
    });
  }
  return out;
}

function parseMonthKey(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  return dateStr.slice(0, 7);
}

function districtFromSociety(society) {
  return (society?.district || "Unknown").trim() || "Unknown";
}

function isEntryGoodQuality(entry) {
  return isGoodQualityByThreshold(entry);
}

function normalizeSession(session) {
  if (!session) return "";
  const value = String(session).trim().toUpperCase();
  if (value === "M" || value === "MORNING") return "M";
  if (value === "E" || value === "EVENING") return "E";
  return "";
}

function toShiftLabel(sessionCode) {
  return sessionCode === "E" ? "Evening" : "Morning";
}

function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getSocietyDashboard(req, res) {
  const societyId = req.query.societyId || "";
  const fromDate = req.query.from || "";
  const toDate = req.query.to || "";
  const today = toDateStr();
  const hasRange = Boolean(fromDate && toDate);
  const rangeFrom = hasRange ? fromDate : today;
  const rangeTo = hasRange ? toDate : today;

  const entries = await MilkEntry.find({ societyId, date: { $gte: rangeFrom, $lte: rangeTo } });
  const totalMilk = sumBy(entries, (e) => e.qty);
  const morning = sumBy(entries, (e) => (e.session === "M" ? e.qty : 0));
  const evening = sumBy(entries, (e) => (e.session === "E" ? e.qty : 0));
  const cow = sumBy(entries, (e) => (e.milkType === "Cow" ? e.qty : 0));
  const buffalo = sumBy(entries, (e) => (e.milkType === "Buffalo" ? e.qty : 0));

  const society = await Society.findOne({ societyId });
  const memberCounts = society?.memberCounts || {};
  const farmerCounts = society?.farmerCounts || {};
  const totalFarmers =
    Object.values(memberCounts).reduce((s, v) => s + (Number(v) || 0), 0) ||
    Object.values(farmerCounts).reduce((s, v) => s + (Number(v) || 0), 0) ||
    0;

  const months = hasRange ? monthBucketsBetween(fromDate, toDate) : lastMonths(3);
  const revenueFrom = hasRange ? fromDate : `${months[0].key}-01`;
  const revenueTo = hasRange ? toDate : toDateStr();
  const rangeEntries = await MilkEntry.find({ societyId, date: { $gte: revenueFrom, $lte: revenueTo } });

  const revenueMap = new Map();
  months.forEach((m) => revenueMap.set(m.label, { month: m.label, buffalo: 0, cow: 0 }));

  rangeEntries.forEach((e) => {
    const d = new Date(e.date);
    const label = monthLabel(d);
    const bucket = revenueMap.get(label);
    if (!bucket) return;
    if (e.milkType === "Buffalo") bucket.buffalo += e.amount || 0;
    if (e.milkType === "Cow") bucket.cow += e.amount || 0;
  });

  const summary = {
    totalMilk: Number(totalMilk.toFixed(2)),
    totalFarmers,
    session: { morning: Number(morning.toFixed(2)), evening: Number(evening.toFixed(2)) },
    type: { cow: Number(cow.toFixed(2)), buffalo: Number(buffalo.toFixed(2)) },
  };

  const milkBreakdown = [
    { name: "Cow Milk", value: summary.type.cow },
    { name: "Buffalo Milk", value: summary.type.buffalo },
  ];

  const feedMineral = society?.feedMineral || [
    { name: "Cattle Feed", qty: "0 Kg", lastReceived: "-" },
    { name: "Mineral Mix", qty: "0 Kg", lastReceived: "-" },
  ];

  const latestBilling = societyId ? await SocietyBilling.findOne({ societyId }).sort({ createdAt: -1 }) : null;
  const totalPayable = Number(latestBilling?.netPayable || 0);

  res.json({
    data: {
      summary,
      totalPayable,
      milkBreakdown,
      revenue: Array.from(revenueMap.values()),
      feedMineral,
    },
  });
}

export async function getBmcDashboard(req, res) {
  const bmcId = req.query.bmcId || "";
  const today = toDateStr();

  const societyQuery = bmcId ? { bmcId } : {};
  const societies = await Society.find(societyQuery, "societyId societyName bmcId");
  const societyIds = societies.map((s) => s.societyId);

  const entries = await MilkEntry.find({ date: today, societyId: { $in: societyIds } });
  const totalMilk = sumBy(entries, (e) => e.qty);
  const cow = sumBy(entries, (e) => (e.milkType === "Cow" ? e.qty : 0));
  const buffalo = sumBy(entries, (e) => (e.milkType === "Buffalo" ? e.qty : 0));

  const verifications = await Verification.find({ date: today, societyId: { $in: societyIds } });
  const verifiedSet = new Set(verifications.map((v) => v.societyId));
  const verifiedQty = sumBy(entries, (e) => (verifiedSet.has(e.societyId) ? e.qty : 0));

  const summary = {
    totalMilk: Number(totalMilk.toFixed(2)),
    totalVerified: Number(verifiedQty.toFixed(2)),
    type: { cow: Number(cow.toFixed(2)), buffalo: Number(buffalo.toFixed(2)) },
  };

  const milkBreakdown = [
    { name: "Cow Milk", value: summary.type.cow },
    { name: "Buffalo Milk", value: summary.type.buffalo },
  ];

  const months = lastMonths(3);
  const from = `${months[0].key}-01`;
  const to = toDateStr();
  const rangeEntries = await MilkEntry.find({ date: { $gte: from, $lte: to }, societyId: { $in: societyIds } });

  const societyNameMap = new Map(societies.map((s) => [s.societyId, s.societyName || s.societyId]));

  const procuredByMonth = {};
  const rejectedByMonth = {};
  months.forEach((m) => {
    procuredByMonth[m.label] = [];
    rejectedByMonth[m.label] = [];
  });

  const monthSocietyTotals = new Map();
  rangeEntries.forEach((e) => {
    const d = new Date(e.date);
    const label = monthLabel(d);
    if (!procuredByMonth[label]) return;
    const key = `${label}::${e.societyId}`;
    const prev = monthSocietyTotals.get(key) || 0;
    monthSocietyTotals.set(key, prev + (e.qty || 0));
  });

  monthSocietyTotals.forEach((qty, key) => {
    const [label, socId] = key.split("::");
    const name = societyNameMap.get(socId) || socId;
    procuredByMonth[label].push({ name, value: Number(qty.toFixed(2)) });
    rejectedByMonth[label].push({ name, value: 0 });
  });

  const dispatchStats = {
    totalDispatches: societies.length,
    pendingDispatches: Math.max(0, societies.length - verifiedSet.size),
  };

  res.json({
    data: {
      summary,
      milkBreakdown,
      milkProcuredByMonth: procuredByMonth,
      milkRejectedByMonth: rejectedByMonth,
      dispatchStats,
    },
  });
}

export async function getDairyDashboard(req, res) {
  const today = getTodayIsoDate();
  const selectedDate = String(req.query.date || "").trim();
  const targetDate = selectedDate || today;
  const session = normalizeSession(req.query.session);
  const dairyUnit = String(req.query.dairyUnit || "").trim();

  let societies = [];
  if (dairyUnit) {
    const regex = new RegExp(escapeRegExp(dairyUnit), "i");
    societies = await Society.find(
      {
        $or: [{ route: dairyUnit }, { route: regex }, { district: regex }, { bmcId: regex }],
      },
      "societyId district route bmcId"
    );
  }

  if (!dairyUnit || !societies.length) {
    societies = await Society.find({}, "societyId district route bmcId");
  }

  const societyIds = societies.map((s) => s.societyId).filter(Boolean);

  if (!societyIds.length) {
    return res.json({
      data: {
        filters: {
          dairyUnit,
          date: targetDate,
          session,
        },
        cards: {
          milkReceived: 0,
          tankerCount: 0,
          pendingVerification: 0,
          totalShortage: 0,
        },
        milkTypeDistribution: [
          { label: "Cow Milk", value: 0 },
          { label: "Buffalo Milk", value: 0 },
        ],
        districtProcurement: [],
        qualityStatus: [
          { label: "Approved Milk", value: 0 },
          { label: "Rejected / Penalised", value: 0 },
        ],
      },
    });
  }

  const entryQuery = {
    societyId: { $in: societyIds },
    date: targetDate,
  };
  const verificationQuery = {
    societyId: { $in: societyIds },
    date: targetDate,
  };

  if (session) {
    entryQuery.session = session;
    verificationQuery.session = session;
  }

  const [entries, verifications] = await Promise.all([
    MilkEntry.find(entryQuery, "societyId date session milkType qty"),
    Verification.find(verificationQuery, "societyId date session verifyChoice entries bmcEntries"),
  ]);

  const societyMap = new Map(societies.map((s) => [s.societyId, s]));

  let milkReceived = 0;
  let cowQty = 0;
  let buffaloQty = 0;
  const districtMap = new Map();
  const shipmentSet = new Set();

  entries.forEach((entry) => {
    const qty = Number(entry.qty || 0);
    milkReceived += qty;

    if (entry.milkType === "Cow") cowQty += qty;
    if (entry.milkType === "Buffalo") buffaloQty += qty;

    const shipmentKey = `${entry.societyId}::${entry.date}::${entry.session}`;
    shipmentSet.add(shipmentKey);

    const district = districtFromSociety(societyMap.get(entry.societyId));
    districtMap.set(district, (districtMap.get(district) || 0) + qty);
  });

  let totalShortage = 0;
  const verifiedSet = new Set();
  let approvedCount = 0;
  let rejectedOrPenalisedCount = 0;

  verifications.forEach((verification) => {
    const verificationKey = `${verification.societyId}::${verification.date}::${verification.session}`;
    verifiedSet.add(verificationKey);

    if (verification.verifyChoice === "YES") {
      approvedCount += 1;
    } else {
      rejectedOrPenalisedCount += 1;
      if (Array.isArray(verification.entries) && Array.isArray(verification.bmcEntries)) {
        verification.entries.forEach((entry, idx) => {
          const bmcEntry = verification.bmcEntries[idx];
          if (!bmcEntry) return;
          const sourceQty = Number(entry?.qty || 0);
          const bmcQty = Number(bmcEntry?.qty || 0);
          totalShortage += Math.max(sourceQty - bmcQty, 0);
        });
      }
    }
  });

  const totalMilkTypeQty = cowQty + buffaloQty;
  const milkTypeDistribution = [
    {
      label: "Cow Milk",
      value: totalMilkTypeQty > 0 ? round((cowQty / totalMilkTypeQty) * 100, 2) : 0,
    },
    {
      label: "Buffalo Milk",
      value: totalMilkTypeQty > 0 ? round((buffaloQty / totalMilkTypeQty) * 100, 2) : 0,
    },
  ];

  const districtProcurement = Array.from(districtMap.entries())
    .map(([district, liters]) => ({ district, liters: round(liters, 2) }))
    .sort((a, b) => b.liters - a.liters);

  const qualityTotal = approvedCount + rejectedOrPenalisedCount;
  const qualityStatus = [
    {
      label: "Approved Milk",
      value: qualityTotal > 0 ? round((approvedCount / qualityTotal) * 100, 2) : 0,
    },
    {
      label: "Rejected / Penalised",
      value: qualityTotal > 0 ? round((rejectedOrPenalisedCount / qualityTotal) * 100, 2) : 0,
    },
  ];

  const shiftOptions = ["All", "Morning", "Evening"];
  const availableShiftSet = new Set(entries.map((entry) => toShiftLabel(entry.session)));

  return res.json({
    data: {
      filters: {
        dairyUnit,
        date: targetDate,
        session,
      },
      shiftOptions: shiftOptions.filter((label) => label === "All" || availableShiftSet.has(label)),
      cards: {
        milkReceived: round(milkReceived, 2),
        tankerCount: shipmentSet.size,
        pendingVerification: Math.max(shipmentSet.size - verifiedSet.size, 0),
        totalShortage: round(totalShortage, 2),
      },
      milkTypeDistribution,
      districtProcurement,
      qualityStatus,
    },
  });
}

export async function getAdminDashboard(req, res) {
  const societies = await Society.find({}, "societyId district bmcId eoId route societyName");
  const societyIds = societies.map((s) => s.societyId).filter(Boolean);

  const today = new Date();
  const currentMonthStart = monthStart(today);
  const sixMonths = buildRecentMonths(6);
  const fromSixMonths = `${sixMonths[0].key}-01`;
  const toToday = isoDate(today);

  const [allEntries, monthlyEntries, verifications] = await Promise.all([
    MilkEntry.find({ societyId: { $in: societyIds } }, "societyId date session milkType fat snf qty amount"),
    MilkEntry.find({ societyId: { $in: societyIds }, date: { $gte: fromSixMonths, $lte: toToday } }, "societyId date milkType fat snf qty amount"),
    Verification.find({ societyId: { $in: societyIds }, date: { $gte: isoDate(currentMonthStart), $lte: toToday } }, "societyId date session"),
  ]);

  const totalSocieties = societies.length;
  const totalBmcs = uniqueCount(societies.map((s) => s.bmcId));
  const totalEos = uniqueCount(societies.map((s) => s.eoId));
  const totalDairyUnits = uniqueCount(societies.map((s) => s.route));

  const totalCowQty = sumBy(allEntries, (e) => (e.milkType === "Cow" ? Number(e.qty || 0) : 0));
  const totalBuffaloQty = sumBy(allEntries, (e) => (e.milkType === "Buffalo" ? Number(e.qty || 0) : 0));
  const totalQty = totalCowQty + totalBuffaloQty;

  const milkProcured = [
    { name: "Cow Milk", value: totalQty > 0 ? round((totalCowQty / totalQty) * 100, 2) : 0 },
    { name: "Buffalo Milk", value: totalQty > 0 ? round((totalBuffaloQty / totalQty) * 100, 2) : 0 },
  ];

  const verifiedSet = new Set(verifications.map((v) => `${v.societyId}::${v.date}::${v.session}`));
  const monthStartStr = isoDate(currentMonthStart);
  const currentMonthEntries = allEntries.filter((e) => e.date >= monthStartStr && e.date <= toToday);
  const billedQty = sumBy(currentMonthEntries, (e) => {
    const key = `${e.societyId}::${e.date}::${e.session}`;
    return verifiedSet.has(key) ? Number(e.qty || 0) : 0;
  });
  const monthQty = sumBy(currentMonthEntries, (e) => Number(e.qty || 0));
  const billedPct = monthQty > 0 ? round((billedQty / monthQty) * 100, 2) : 0;

  const finance = [
    { name: "Billed", value: billedPct },
    { name: "Unbilled", value: round(100 - billedPct, 2) },
  ];

  const districtQty = new Map();
  const districtAmount = new Map();
  const bmcDailyQty = new Map();
  const societyMap = new Map(societies.map((s) => [s.societyId, s]));

  allEntries.forEach((entry) => {
    const society = societyMap.get(entry.societyId);
    const district = districtFromSociety(society);
    const qty = Number(entry.qty || 0);
    const amount = Number(entry.amount || 0);
    districtQty.set(district, (districtQty.get(district) || 0) + qty);
    districtAmount.set(district, (districtAmount.get(district) || 0) + amount);

    const bmcKey = society?.bmcId || "Unknown";
    const dayKey = `${bmcKey}::${entry.date}`;
    bmcDailyQty.set(dayKey, (bmcDailyQty.get(dayKey) || 0) + qty);
  });

  const procurement = Array.from(districtQty.entries())
    .map(([name, value]) => ({ name, value: round(value, 2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const districtRevenue = Array.from(districtAmount.entries())
    .map(([name, value]) => ({ name, value: round(value, 2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const bmcAgg = new Map();
  bmcDailyQty.forEach((qty, key) => {
    const [bmcId] = key.split("::");
    const prev = bmcAgg.get(bmcId) || { totalQty: 0, days: 0 };
    prev.totalQty += qty;
    prev.days += 1;
    bmcAgg.set(bmcId, prev);
  });

  const dairyUnits = Array.from(bmcAgg.entries())
    .map(([name, value]) => ({
      name,
      value: value.days > 0 ? round(value.totalQty / value.days, 2) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const qualityByMonth = new Map(
    sixMonths.map((m) => [m.key, { month: m.label, good: 0, penalised: 0 }])
  );

  monthlyEntries.forEach((entry) => {
    const key = parseMonthKey(entry.date);
    const bucket = qualityByMonth.get(key);
    if (!bucket) return;
    const qty = Number(entry.qty || 0);
    if (isEntryGoodQuality(entry)) bucket.good += qty;
    else bucket.penalised += qty;
  });

  const monthlyQuality = sixMonths.map((m) => {
    const row = qualityByMonth.get(m.key) || { month: m.label, good: 0, penalised: 0 };
    return {
      month: m.label,
      good: round(row.good, 2),
      penalised: round(row.penalised, 2),
    };
  });

  const currentYear = today.getFullYear();
  const previousYear = currentYear - 1;
  const revenueMap = new Map();
  for (let month = 0; month < 12; month += 1) {
    const d = new Date(currentYear, month, 1);
    revenueMap.set(month + 1, { month: monthLabel(d), nov: 0, dec: 0 });
  }

  allEntries.forEach((entry) => {
    const d = new Date(entry.date);
    if (Number.isNaN(d.getTime())) return;
    const month = d.getMonth() + 1;
    const row = revenueMap.get(month);
    if (!row) return;
    const amount = Number(entry.amount || 0);
    if (d.getFullYear() === previousYear) row.nov += amount;
    if (d.getFullYear() === currentYear) row.dec += amount;
  });

  const revenue = Array.from(revenueMap.values()).map((row) => ({
    month: row.month,
    nov: round(row.nov, 2),
    dec: round(row.dec, 2),
  }));

  return res.json({
    data: {
      topStats: [
        { label: "No. Of DCS", value: totalSocieties, icon: "Building2" },
        { label: "No. Of BMC", value: totalBmcs, icon: "LandPlot" },
        { label: "No. Of EO", value: totalEos, icon: "BadgeCheck" },
        { label: "No. Of Dairy Units", value: totalDairyUnits, icon: "Factory" },
      ],
      milkProcured,
      finance,
      procurement,
      dairyUnits,
      districtRevenue,
      monthlyQuality,
      revenue,
      revenueLegend: {
        nov: `${previousYear}`,
        dec: `${currentYear}`,
      },
    },
  });
}



