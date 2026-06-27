export const RATE_TABLE = {
  Cow: [
    { minFat: 3.5, maxFat: 4.0, minSnf: 8.0, maxSnf: 8.5, rate: 28 },
    { minFat: 4.0, maxFat: 4.5, minSnf: 8.5, maxSnf: 9.0, rate: 32 },
    { minFat: 4.5, maxFat: 5.0, minSnf: 9.0, maxSnf: 9.5, rate: 36 },
    { minFat: 5.0, maxFat: 5.5, minSnf: 9.5, maxSnf: 10.0, rate: 40 },
    { minFat: 5.5, maxFat: 6.0, minSnf: 10.0, maxSnf: 10.5, rate: 44 },
  ],
  Buffalo: [
    { minFat: 6.0, maxFat: 6.5, minSnf: 9.0, maxSnf: 9.5, rate: 52 },
    { minFat: 6.5, maxFat: 7.0, minSnf: 9.5, maxSnf: 10.0, rate: 58 },
    { minFat: 7.0, maxFat: 7.5, minSnf: 10.0, maxSnf: 10.5, rate: 64 },
    { minFat: 7.5, maxFat: 8.0, minSnf: 10.5, maxSnf: 11.0, rate: 70 },
    { minFat: 8.0, maxFat: 9.0, minSnf: 11.0, maxSnf: 12.0, rate: 76 },
  ],
};

export const DEFAULT_RATE = { Cow: 28, Buffalo: 52 };

export const QUALITY_STANDARDS = {
  Cow: { minFat: 3.5, maxFat: 6.0, minSnf: 8.0, maxSnf: 10.5 },
  Buffalo: { minFat: 6.0, maxFat: 9.0, minSnf: 9.0, maxSnf: 12.0 },
};

export const round = (v, d = 2) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
export const safeNum = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) || n < 0 ? 0 : n;
};
export const fmtINR = (n) =>
  `Rs. ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function lookupRate(type, fat, snf) {
  const tbl = RATE_TABLE[type];
  if (!tbl) return DEFAULT_RATE[type] || 0;
  const match = tbl.find(
    (r) => fat >= r.minFat && fat <= r.maxFat && snf >= r.minSnf && snf <= r.maxSnf,
  );
  return match ? match.rate : DEFAULT_RATE[type];
}

export function calcEntry(type, fat, snf, qty) {
  fat = safeNum(fat);
  snf = safeNum(snf);
  qty = safeNum(qty);
  const rate = lookupRate(type, fat, snf);
  const amount = round(rate * qty);
  return {
    type,
    fat,
    snf,
    qty,
    rate: round(rate),
    amount,
    rateFmt: fmtINR(rate),
    amtFmt: fmtINR(amount),
  };
}

export function validateEntry(type, fat, snf, qty) {
  const errs = [];
  fat = safeNum(fat);
  snf = safeNum(snf);
  qty = safeNum(qty);
  if (!["Cow", "Buffalo"].includes(type)) {
    errs.push("Unknown type");
    return { valid: false, errs };
  }
  const std = QUALITY_STANDARDS[type];
  if (fat < std.minFat || fat > std.maxFat) {
    errs.push(`FAT ${fat} out of [${std.minFat}-${std.maxFat}]`);
  }
  if (snf < std.minSnf || snf > std.maxSnf) {
    errs.push(`SNF ${snf} out of [${std.minSnf}-${std.maxSnf}]`);
  }
  if (qty <= 0) errs.push("Qty must be > 0");
  return { valid: errs.length === 0, errs };
}

export function calcSession(entries) {
  const processed = entries.map((e) => calcEntry(e.type, e.fat, e.snf, e.qty));
  const totalQty = round(processed.reduce((s, e) => s + e.qty, 0));
  const totalAmt = round(processed.reduce((s, e) => s + e.amount, 0));
  return { entries: processed, totalQty, totalAmt, totalAmtFmt: fmtINR(totalAmt) };
}

export function compareVals(soc, bmc, tol = 2) {
  const fields = ["fat", "snf", "qty"];
  const res = {};
  let matched = true;
  fields.forEach((f) => {
    const sv = safeNum(soc[f]);
    const bv = safeNum(bmc[f]);
    const diff = Math.abs(sv - bv);
    const pct = sv > 0 ? round((diff / sv) * 100) : bv > 0 ? 100 : 0;
    const ok = pct <= tol;
    if (!ok) matched = false;
    res[f] = {
      sv,
      bv,
      diff: round(diff, 3),
      pct,
      ok,
      status: ok ? "Match" : "Mismatch",
    };
  });
  return { fields: res, ok: matched };
}

export function genReport(name, sEntries, bEntries) {
  const ss = calcSession(sEntries);
  const bs = calcSession(bEntries);
  const comps = sEntries
    .map((se, i) => {
      const be = bEntries[i];
      if (!be) return null;
      return { type: se.type, cmp: compareVals(se, be), sCalc: ss.entries[i], bCalc: bs.entries[i] };
    })
    .filter(Boolean);
  const allOk = comps.every((c) => c.cmp.ok);
  return {
    name,
    allOk,
    status: allOk ? "VERIFIED" : "DISCREPANCY FOUND",
    sTotals: { qty: ss.totalQty, amt: ss.totalAmtFmt },
    bTotals: { qty: bs.totalQty, amt: bs.totalAmtFmt },
    comps,
  };
}

export const SOCIETIES_DATA = [
  { name: "Andhral Society", status: "not-verified", qty: 220 },
  { name: "Basapur Society", status: "verified", qty: 180 },
  { name: "Kallur Society", status: "not-verified", qty: 95 },
  { name: "Dodderi Society", status: "not-verified", qty: 143 },
  { name: "Halageri Society", status: "verified", qty: 210 },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "warning",
    title: "Kallur Society - Verification Pending",
    desc: "Morning session not yet verified. Deadline in 30 min.",
    time: "8 min ago",
    read: false,
  },
  {
    id: 2,
    type: "error",
    title: "FAT% Mismatch - Andhral Society",
    desc: "Buffalo entry FAT differs from BMC reading by 8.5%.",
    time: "25 min ago",
    read: false,
  },
  {
    id: 3,
    type: "success",
    title: "Basapur Society Verified",
    desc: "Verification confirmed by Aladahalli BMC.",
    time: "41 min ago",
    read: false,
  },
  {
    id: 4,
    type: "info",
    title: "Dodderi Society - Low Quantity Alert",
    desc: "Collected quantity (143 L) is 18% below average.",
    time: "1 hr ago",
    read: true,
  },
  {
    id: 5,
    type: "info",
    title: "Morning Collection Session Started",
    desc: "All societies are open for data entry.",
    time: "2 hr ago",
    read: true,
  },
];

export const NOTIF_STYLES = {
  warning: {
    bg: "#fffbeb",
    color: "#b45309",
    path:
      "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  },
  error: {
    bg: "#fef2f2",
    color: "#dc2626",
    path:
      "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  success: {
    bg: "#f0fdf4",
    color: "#16a34a",
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  info: {
    bg: "#eff6ff",
    color: "#2563eb",
    path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

export const BMC_USER = { name: "Aladahalli BMC", initials: "A", role: "Bulk Milk Cooler" };

export const emptyRow = () => ({ type: "", fat: "", snf: "", qty: "" });

export function isRowValid(r) {
  const f = parseFloat(r.fat);
  const s = parseFloat(r.snf);
  const q = parseFloat(r.qty);
  return r.type && !Number.isNaN(f) && f > 0 && !Number.isNaN(s) && s > 0 && !Number.isNaN(q) && q > 0;
}
