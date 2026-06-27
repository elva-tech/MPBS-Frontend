import { fetchBillingCycles, fetchSocieties } from "../../utils/api";

const STORAGE_KEY = "account_module_state_v2";
const STATE_VERSION = 2;

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialState() {
  return {
    version: STATE_VERSION,
    selectedCycleId: "",
    selectedSocietyId: "",
    societies: [],
    cycles: [],
    milkData: [],
    schemes: [],
    claims: [], 
    recoverables: [],
    recoverableTransactions: [],
    billingResults: {},
    payments: [],
    invoiceDispatch: [],
    auditLogs: [],
  };
}

function isLegacyMockState(state = {}) {
  const societyIds = (state.societies || []).map((society) => society?.id).filter(Boolean);
  const cycleIds = (state.cycles || []).map((cycle) => cycle?.id).filter(Boolean);
  const schemeIds = (state.schemes || []).map((scheme) => scheme?.id).filter(Boolean);

  const hasLegacySocieties = societyIds.length === 3 && ["S001", "S023", "S040"].every((id) => societyIds.includes(id));
  const hasLegacyCycles = ["1-10", "11-20", "21-END"].every((id) => cycleIds.includes(id));
  const hasLegacySchemes = ["SCH_01", "SCH_02", "SCH_03", "SCH_04"].every((id) => schemeIds.includes(id));

  return hasLegacySocieties && hasLegacyCycles && hasLegacySchemes;
}

function toDateOnly(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function compareCycleDates(a, b) {
  const aTime = new Date(a.start || a.startDate || a.end || a.endDate || 0).getTime();
  const bTime = new Date(b.start || b.startDate || b.end || b.endDate || 0).getTime();
  return aTime - bTime;
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
  const startDate = new Date(year, month, startDay);
  const endDate = new Date(year, month, endDay);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const startFormat = startYear === endYear ? { month: "short", day: "2-digit" } : { month: "short", day: "2-digit", year: "numeric" };

  return {
    code: `${monthKey}-C${cycleNumber}`,
    startDate: toDateOnly(startDate),
    endDate: toDateOnly(endDate),
    displayLabel: `${startDate.toLocaleDateString("en-IN", startFormat)} - ${endDate.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}`,
  };
}

function buildCycleFromWindow(window, status = "OPEN") {
  return {
    id: window.code,
    start: window.startDate,
    end: window.endDate,
    status,
  };
}

function getCurrentCycle(cycles = [], window = getBillingCycleWindow(new Date())) {
  const existing = cycles.find((cycle) => cycle.id === window.code || cycle.code === window.code);
  if (existing) {
    return {
      ...buildCycleFromWindow(window, existing.status || "OPEN"),
      ...normalizeCycle(existing),
      id: window.code,
      start: window.startDate,
      end: window.endDate,
      status: existing.status || "OPEN",
    };
  }

  return buildCycleFromWindow(window, "OPEN");
}

function formatCycleLabel(cycle = {}) {
  const start = toDateOnly(cycle.start || cycle.startDate || "");
  const end = toDateOnly(cycle.end || cycle.endDate || "");
  if (!start && !end) return cycle.id || cycle.code || "-";
  if (!start) return new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (!end) return new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const startDate = new Date(start);
  const endDate = new Date(end);
  const startText = startDate.toLocaleDateString(
    "en-IN",
    startDate.getFullYear() === endDate.getFullYear()
      ? { day: "2-digit", month: "short" }
      : { day: "2-digit", month: "short", year: "numeric" }
  );
  const endText = endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return `${startText} - ${endText}`;
}

function normalizeCycle(cycle = {}, index = 0) {
  const id = String(cycle.id || cycle.code || `CYCLE-${index + 1}`);
  const start = toDateOnly(cycle.start || cycle.startDate || cycle.fromDate || "");
  const end = toDateOnly(cycle.end || cycle.endDate || cycle.toDate || "");

  return {
    ...cycle,
    id,
    start,
    end,
    type: cycle.type || "REGULAR",
    label: cycle.label || (cycle.type === "EXTRA" ? "Extra Cycle" : id),
    status: cycle.status || "OPEN",
  };
}

function normalizeCycleList(cycles = []) {
  return cycles.map((cycle, index) => normalizeCycle(cycle, index)).sort(compareCycleDates);
}

function normalizeScheme(scheme = {}, index = 0) {
  return {
    id: scheme.id || `SCH_${index + 1}`,
    name: scheme.name || `Scheme ${index + 1}`,
    type: scheme.type || "INCENTIVE",
    calculationType: scheme.calculationType || "FIXED",
    value: Number(scheme.value || 0),
    isActive: scheme.isActive !== false,
    appliesTo: Array.isArray(scheme.appliesTo) && scheme.appliesTo.length ? scheme.appliesTo : ["ALL"],
    condition: scheme.condition || null,
  };
}

function normalizeState(state) {
  const next = state || {};
  if (!next.cycles || !next.societies) return createInitialState();
  if (isLegacyMockState(next)) {
    return createInitialState();
  }
  const currentWindow = getBillingCycleWindow(new Date());
  next.cycles = next.cycles.length ? normalizeCycleList(next.cycles) : [buildCycleFromWindow(currentWindow, "OPEN")];
  next.schemes = Array.isArray(next.schemes) ? next.schemes.map(normalizeScheme) : [];
  next.version = STATE_VERSION;
  if (!next.billingResults) next.billingResults = {};
  if (!next.payments) next.payments = [];
  if (!next.claims) next.claims = [];
  if (!next.recoverables) next.recoverables = [];
  if (!next.recoverableTransactions) next.recoverableTransactions = [];
  if (!next.auditLogs) next.auditLogs = [];
  if (!next.invoiceDispatch) next.invoiceDispatch = [];
  const selectedCycleExists = next.cycles.some((cycle) => cycle.id === next.selectedCycleId);
  next.selectedCycleId = selectedCycleExists
    ? next.selectedCycleId
    : next.cycles.find((cycle) => cycle.id === currentWindow.code)?.id || next.cycles.at(-1)?.id || currentWindow.code;
  if (!next.selectedSocietyId) next.selectedSocietyId = next.societies[0]?.id || "";
  if (!next.societies.some((society) => society.id === next.selectedSocietyId)) {
    next.selectedSocietyId = next.societies[0]?.id || "";
  }
  return next;
}

export function loadAccountState() {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    const initial = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function normalizeSocietyList(list = []) {
  return list
    .map((society) => ({
      id: society.id || society.societyId || society.code || "",
      name: society.name || society.societyName || society.societyId || "",
      district: society.district || "",
      active: society.active !== false,
    }))
    .filter((society) => society.id && society.name);
}

export async function hydrateAccountSocieties() {
  if (typeof window === "undefined") return loadAccountState();

  const current = loadAccountState();

  try {
    const [societiesPayload, billingCyclesPayload] = await Promise.all([fetchSocieties(), fetchBillingCycles()]);
    const societies = normalizeSocietyList(Array.isArray(societiesPayload?.data) ? societiesPayload.data : societiesPayload || []);
    const billingCycles = normalizeCycleList(Array.isArray(billingCyclesPayload?.data) ? billingCyclesPayload.data : billingCyclesPayload || []);

    if (!societies.length) return current;

    const currentWindow = getBillingCycleWindow(new Date());
    const currentCycle = buildCycleFromWindow(currentWindow, "OPEN");
    const selectedCycleId =
      (current.selectedCycleId && billingCycles.some((cycle) => cycle.id === current.selectedCycleId) && current.selectedCycleId) ||
      billingCycles.find((cycle) => cycle.id === currentWindow.code)?.id ||
      billingCycles.at(-1)?.id ||
      currentCycle.id;

    const merged = {
      ...current,
      societies,
      cycles: billingCycles.length ? billingCycles : [currentCycle],
      selectedCycleId,
      selectedSocietyId: societies.some((society) => society.id === current.selectedSocietyId)
        ? current.selectedSocietyId
        : societies[0]?.id || current.selectedSocietyId,
    };

    saveAccountState(merged);
    return merged;
  } catch {
    return current;
  }
}

function saveAccountState(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pushAudit(state, action, details = {}) {
  state.auditLogs.unshift({
    id: makeId("AUD"),
    at: new Date().toISOString(),
    action,
    details,
  });
}

function getCycle(state, cycleId) {
  return state.cycles.find((item) => item.id === cycleId);
}

function getMilkRows(state, cycleId, societyId) {
  return state.milkData.filter((item) => item.cycleId === cycleId && item.societyId === societyId);
}

function getMilkRow(state, cycleId, societyId) {
  const rows = getMilkRows(state, cycleId, societyId);
  return summarizeMilkRows(rows);
}

function summarizeMilkRows(rows = []) {
  return rows.reduce(
    (summary, row) => {
      const qty = Number(row?.qty || 0);
      summary.qty += qty;
      summary.milkAmount += Number(row?.milkAmount || 0);
      summary.cowQty += Number(row?.cowQty || 0);
      summary.buffaloQty += Number(row?.buffaloQty || 0);
      summary.fatWeighted += Number(row?.avgFat || 0) * qty;
      return summary;
    },
    { qty: 0, milkAmount: 0, cowQty: 0, buffaloQty: 0, fatWeighted: 0 }
  );
}

function schemeAppliesToSociety(scheme, societyId) {
  return scheme.appliesTo?.includes("ALL") || scheme.appliesTo?.includes(societyId);
}

function adjustmentAppliesToSociety(adjustment, societyId) {
  return adjustment.societyId === "ALL" || adjustment.societyId === societyId;
}

function conditionPasses(scheme, milkRow) {
  if (!scheme.condition) return true;
  const { metric, op, threshold } = scheme.condition;
  const value = Number(milkRow?.[metric] || 0);
  if (op === ">") return value > Number(threshold);
  if (op === ">=") return value >= Number(threshold);
  if (op === "<") return value < Number(threshold);
  if (op === "<=") return value <= Number(threshold);
  return false;
}

function calculateSchemeAmount(scheme, milkRow) {
  const qty = Number(milkRow?.qty || 0);
  if (scheme.calculationType === "PER_LITRE") return qty * Number(scheme.value || 0);
  if (scheme.calculationType === "FIXED") return Number(scheme.value || 0);
  if (scheme.calculationType === "CONDITION") return qty * Number(scheme.value || 0);
  return 0;
}

export function calculateSocietyBilling(state, cycleId, societyId) {
  const milkRows = getMilkRows(state, cycleId, societyId);
  const milkSummary = summarizeMilkRows(milkRows);

  const appliedClaims = state.claims.filter(
    (item) => item.cycleId === cycleId && adjustmentAppliesToSociety(item, societyId) && item.status === "APPLIED"
  );
  const totalClaims = appliedClaims.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const activeSchemes = state.schemes.filter(
    (scheme) => scheme.isActive && schemeAppliesToSociety(scheme, societyId) && conditionPasses(scheme, milkSummary)
  );

  let totalSchemeBenefits = 0;
  let totalSchemeDeductions = 0;

  const schemeLineItems = activeSchemes.map((scheme) => {
    const amount = calculateSchemeAmount(scheme, milkSummary);
    if (scheme.type === "DEDUCTION") totalSchemeDeductions += amount;
    else totalSchemeBenefits += amount;
    return {
      type: "SCHEME",
      referenceId: scheme.id,
      description: scheme.name,
      schemeType: scheme.type,
      amount: scheme.type === "DEDUCTION" ? -amount : amount,
    };
  });

  const schemeDeductions = schemeLineItems.filter((item) => item.amount < 0);

  const activeRecoverables = state.recoverables.filter(
    (item) => adjustmentAppliesToSociety(item, societyId) && item.status === "ACTIVE" && Number(item.remainingAmount || 0) > 0
  );
  const recoverableBreakdown = activeRecoverables.map((item) => ({
    id: item.id,
    amount: Math.min(Number(item.installmentAmount || 0), Number(item.remainingAmount || 0)),
    reason: item.reason,
  }));
  const totalRecoverables = recoverableBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const netPayable =
    Number(milkSummary.milkAmount || 0) +
    totalClaims +
    totalSchemeBenefits -
    totalRecoverables -
    totalSchemeDeductions;

  return {
    societyId,
    cycleId,
    totalMilkQty: Number(milkSummary.qty || 0),
    milkAmount: Number(milkSummary.milkAmount || 0),
    totalClaims,
    totalRecoverables,
    totalSchemeDeductions,
    totalSchemeBenefits,
    netPayable: Math.max(0, Math.round(netPayable)),
    breakdown: {
      claims: appliedClaims,
      recoverables: recoverableBreakdown,
      schemes: schemeLineItems,
      schemeDeductions,
    },
  };
}

export function runBillingForCycle(cycleId) {
  const state = loadAccountState();
  const cycle = getCycle(state, cycleId);
  if (!cycle) return { ok: false, message: "Cycle not found." };
  if (cycle.status === "LOCKED" || cycle.status === "PAID") {
    return { ok: false, message: "Cycle already locked/paid. Billing cannot be rerun." };
  }

  const rows = state.societies.map((society) => calculateSocietyBilling(state, cycleId, society.id));
  state.billingResults[cycleId] = rows;
  cycle.status = "CALCULATED";
  state.selectedCycleId = cycleId;
  pushAudit(state, "RUN_BILLING", { cycleId, societies: rows.length });
  saveAccountState(state);
  return { ok: true, message: `Billing calculated for cycle ${cycleId}.`, state };
}

export function lockCycle(cycleId) {
  const state = loadAccountState();
  const cycle = getCycle(state, cycleId);
  if (!cycle) return { ok: false, message: "Cycle not found." };
  if (cycle.status === "LOCKED") return { ok: false, message: "Cycle is already locked." };
  if (cycle.status === "PAID") return { ok: false, message: "Cycle already paid." };

  if (!state.billingResults[cycleId]) {
    const run = runBillingForCycle(cycleId);
    if (!run.ok) return run;
    return lockCycle(cycleId);
  }

  cycle.status = "LOCKED";
  state.selectedCycleId = cycleId;
  pushAudit(state, "LOCK_CYCLE", { cycleId });
  saveAccountState(state);
  return { ok: true, message: `Cycle ${cycleId} locked successfully.`, state };
}

export function disburseCycle(cycleId) {
  const state = loadAccountState();
  const cycle = getCycle(state, cycleId);
  if (!cycle) return { ok: false, message: "Cycle not found." };
  if (cycle.status !== "LOCKED") return { ok: false, message: "Only locked cycle can be disbursed." };

  const billingRows = state.billingResults[cycleId] || [];
  if (billingRows.length === 0) return { ok: false, message: "No billing rows found for this cycle." };

  for (const row of billingRows) {
    const paymentExists = state.payments.some(
      (payment) => payment.cycleId === cycleId && payment.societyId === row.societyId && payment.status === "SUCCESS"
    );
    if (!paymentExists) {
      state.payments.push({
        id: makeId("PAY"),
        cycleId,
        societyId: row.societyId,
        amount: row.netPayable,
        status: "SUCCESS",
        transactionRef: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      });
    }

    for (const rec of row.breakdown.recoverables) {
      const recoverable = state.recoverables.find((item) => item.id === rec.id);
      if (!recoverable) continue;
      const deduct = Math.min(Number(rec.amount || 0), Number(recoverable.remainingAmount || 0));
      if (deduct <= 0) continue;
      recoverable.remainingAmount = Number(recoverable.remainingAmount || 0) - deduct;
      if (recoverable.remainingAmount <= 0) {
        recoverable.remainingAmount = 0;
        recoverable.status = "CLOSED";
      }
      state.recoverableTransactions.push({
        id: makeId("RECTX"),
        recoverableId: recoverable.id,
        billingCycleId: cycleId,
        deductedAmount: deduct,
        createdAt: new Date().toISOString(),
      });
    }
  }

  cycle.status = "PAID";
  pushAudit(state, "DISBURSE_CYCLE", { cycleId, payments: billingRows.length });
  saveAccountState(state);
  return { ok: true, message: `Cycle ${cycleId} disbursed successfully.`, state };
}

export function addBillingCycle() {
  const state = loadAccountState();
  const window = getBillingCycleWindow(new Date());
  const existing = state.cycles.find((cycle) => cycle.id === window.code);

  if (existing) {
    state.selectedCycleId = existing.id;
    saveAccountState(state);
    return { ok: true, message: `Cycle ${existing.id} already exists.`, state };
  }

  state.cycles.push({
    ...buildCycleFromWindow(window, "OPEN"),
  });
  state.cycles.sort(compareCycleDates);
  state.selectedCycleId = window.code;

  for (const society of state.societies) {
    state.milkData.push({
      cycleId: window.code,
      societyId: society.id,
      qty: 0,
      cowQty: 0,
      buffaloQty: 0,
      milkAmount: 0,
      avgFat: 0,
    });
  }

  pushAudit(state, "CREATE_CYCLE", { cycleId: window.code, window: window.displayLabel });
  saveAccountState(state);
  return { ok: true, message: `Cycle ${window.code} created for ${window.displayLabel}.`, state };
}

export function addScheme(payload) {
  const state = loadAccountState();
  const scheme = {
    id: makeId("SCH"),
    name: payload.name,
    type: payload.type || "INCENTIVE",
    calculationType: payload.calculationType || "FIXED",
    value: Number(payload.value || 0),
    isActive: true,
    appliesTo: payload.appliesTo?.length ? payload.appliesTo : ["ALL"],
    condition: payload.condition || null,
  };
  state.schemes.unshift(scheme);
  pushAudit(state, "CREATE_SCHEME", { schemeId: scheme.id, name: scheme.name });
  saveAccountState(state);
  return { ok: true, message: `Scheme "${scheme.name}" added.`, state };
}

export function deleteScheme(schemeId) {
  const state = loadAccountState();
  const scheme = state.schemes.find((item) => item.id === schemeId);
  if (!scheme) return { ok: false, message: "Scheme not found." };
  state.schemes = state.schemes.filter((item) => item.id !== schemeId);
  pushAudit(state, "DELETE_SCHEME", { schemeId, name: scheme.name });
  saveAccountState(state);
  return { ok: true, message: `Scheme "${scheme.name}" deleted.`, state };
}

export function toggleScheme(schemeId) {
  const state = loadAccountState();
  const scheme = state.schemes.find((item) => item.id === schemeId);
  if (!scheme) return { ok: false, message: "Scheme not found." };
  scheme.isActive = !scheme.isActive;
  const status = scheme.isActive ? "enabled" : "disabled";
  pushAudit(state, "TOGGLE_SCHEME", { schemeId, name: scheme.name, isActive: scheme.isActive });
  saveAccountState(state);
  return { ok: true, message: `Scheme "${scheme.name}" ${status}.`, state };
}

export function addAdjustment(payload) {
  const state = loadAccountState();
  const amount = Number(payload.amount || 0);
  if (!amount || amount <= 0) return { ok: false, message: "Amount must be greater than zero." };

  if (payload.kind === "CLAIM") {
    state.claims.unshift({
      id: makeId("CLM"),
      cycleId: payload.cycleId,
      societyId: payload.societyId || "ALL",
      reason: payload.reason || "Manual claim",
      amount,
      status: "APPLIED",
      createdAt: new Date().toISOString(),
    });
    pushAudit(state, "ADD_CLAIM", { societyId: payload.societyId || "ALL", cycleId: payload.cycleId, amount });
  } else {
    const installment = Number(payload.installmentAmount || amount);
    state.recoverables.unshift({
      id: makeId("REC"),
      societyId: payload.societyId || "ALL",
      reason: payload.reason || "Manual recoverable",
      totalAmount: amount,
      remainingAmount: amount,
      installmentAmount: installment,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    pushAudit(state, "ADD_RECOVERABLE", { societyId: payload.societyId || "ALL", amount, installment });
  }

  saveAccountState(state);
  return { ok: true, message: `${payload.kind === "CLAIM" ? "Claim" : "Recoverable"} added successfully.`, state };
}

export function deleteAdjustment(kind, adjustmentId) {
  const state = loadAccountState();
  if (kind === "CLAIM") {
    const claim = state.claims.find((item) => item.id === adjustmentId);
    if (!claim) return { ok: false, message: "Claim not found." };
    state.claims = state.claims.filter((item) => item.id !== adjustmentId);
    pushAudit(state, "DELETE_CLAIM", { claimId: adjustmentId, societyId: claim.societyId });
    saveAccountState(state);
    return { ok: true, message: "Claim deleted.", state };
  }

  const recoverable = state.recoverables.find((item) => item.id === adjustmentId);
  if (!recoverable) return { ok: false, message: "Recoverable not found." };
  state.recoverables = state.recoverables.filter((item) => item.id !== adjustmentId);
  pushAudit(state, "DELETE_RECOVERABLE", { recoverableId: adjustmentId, societyId: recoverable.societyId });
  saveAccountState(state);
  return { ok: true, message: "Recoverable deleted.", state };
}

export function toggleAdjustmentStatus(kind, adjustmentId) {
  const state = loadAccountState();
  if (kind === "CLAIM") {
    const claim = state.claims.find((item) => item.id === adjustmentId);
    if (!claim) return { ok: false, message: "Claim not found." };
    claim.status = claim.status === "APPLIED" ? "PENDING" : "APPLIED";
    pushAudit(state, "TOGGLE_CLAIM", { claimId: adjustmentId, status: claim.status });
    saveAccountState(state);
    return { ok: true, message: `Claim ${claim.status === "APPLIED" ? "enabled" : "disabled"}.`, state };
  }

  const recoverable = state.recoverables.find((item) => item.id === adjustmentId);
  if (!recoverable) return { ok: false, message: "Recoverable not found." };
  recoverable.status = recoverable.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  pushAudit(state, "TOGGLE_RECOVERABLE", { recoverableId: adjustmentId, status: recoverable.status });
  saveAccountState(state);
  return { ok: true, message: `Recoverable ${recoverable.status === "ACTIVE" ? "enabled" : "disabled"}.`, state };
}

export function setSelections({ cycleId, societyId }) {
  const state = loadAccountState();
  if (cycleId) state.selectedCycleId = cycleId;
  if (societyId) state.selectedSocietyId = societyId;
  saveAccountState(state);
  return state;
}

export function markInvoiceSent(cycleId, societyId) {
  const state = loadAccountState();
  const exists = state.invoiceDispatch.some((item) => item.cycleId === cycleId && item.societyId === societyId);
  if (!exists) {
    state.invoiceDispatch.push({
      id: makeId("INV"),
      cycleId,
      societyId,
      sentAt: new Date().toISOString(),
    });
  }
  pushAudit(state, "SEND_INVOICE", { cycleId, societyId });
  saveAccountState(state);
  return { ok: true, message: "Invoice sent to society.", state };
}

export function getCycleBillingRows(state, cycleId) {
  return state.billingResults[cycleId] || [];
}

export function getOrCalculateCycleRows(state, cycleId) {
  if (!state.billingResults[cycleId]) {
    return state.societies.map((society) => calculateSocietyBilling(state, cycleId, society.id));
  }
  return state.billingResults[cycleId];
}

function compareYearMonth(a, b) {
  const ay = Number(a?.year || 0);
  const am = Number(a?.month || 0);
  const by = Number(b?.year || 0);
  const bm = Number(b?.month || 0);
  if (ay !== by) return ay - by;
  return am - bm;
}

function resolveReferenceYearMonth(state, cycleId) {
  const selectedCycle = state.cycles.find((cycle) => cycle.id === cycleId) || null;
  const fromDate = new Date(selectedCycle?.start || selectedCycle?.startDate || "");
  if (!Number.isNaN(fromDate.getTime())) {
    return {
      year: fromDate.getFullYear(),
      month: fromDate.getMonth() + 1,
    };
  }

  const cycleCode = String(selectedCycle?.code || selectedCycle?.id || cycleId || "").trim();
  const match = cycleCode.match(/^(\d{4})-(\d{2})-C[123]$/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
    };
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function getBillingCycleDateStatus(cycle, referenceDate = new Date()) {
  const startDate = new Date(cycle?.start || cycle?.startDate || cycle?.fromDate || "");
  const endDate = new Date(cycle?.end || cycle?.endDate || cycle?.toDate || "");
  const currentDate = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || Number.isNaN(currentDate.getTime())) {
    return cycle?.status || "OPEN";
  }

  if (currentDate < startDate) return "Pending";
  if (currentDate > endDate) return "Completed";
  return "In Progress";
}

function buildCycleProgressBands(referenceDate = new Date()) {
  const now = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate);
  if (Number.isNaN(now.getTime())) {
    return [];
  }

  const currentDay = now.getDate();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const bands = [
    { cycle: "Cycle 1", range: "1-10", startDay: 1, endDay: 10 },
    { cycle: "Cycle 2", range: "11-20", startDay: 11, endDay: 20 },
    { cycle: "Cycle 3", range: "21-End", startDay: 21, endDay: lastDayOfMonth },
  ];

  return bands.map((band) => ({
    cycle: band.cycle,
    range: band.range,
    step: currentDay < band.startDay ? "Pending" : currentDay > band.endDay ? "Completed" : "In Progress",
  }));
}

export function buildDashboardMetrics(state, cycleId) {
  const rows = getOrCalculateCycleRows(state, cycleId);
  const totalMilk = rows.reduce((sum, row) => sum + Number(row.totalMilkQty || 0), 0);
  const totalPayable = rows.reduce((sum, row) => sum + Number(row.milkAmount || 0), 0);
  const totalDeductions = rows.reduce(
    (sum, row) => sum + Number(row.totalRecoverables || 0) + Number(row.totalSchemeDeductions || 0) + Number(row.transportPenalty || 0),
    0
  );
  const netPayout = rows.reduce((sum, row) => sum + Number(row.netPayable || 0), 0);

  const totalCow = rows.reduce((sum, row) => {
    const milk = getMilkRow(state, cycleId, row.societyId);
    return sum + Number(milk?.cowQty || 0);
  }, 0);
  const totalBuffalo = rows.reduce((sum, row) => {
    const milk = getMilkRow(state, cycleId, row.societyId);
    return sum + Number(milk?.buffaloQty || 0);
  }, 0);
  const totalType = totalCow + totalBuffalo || 1;

  return {
    cards: [
      { label: "Total Milk Procured", value: `${totalMilk.toLocaleString("en-IN")} L`, sub: `(Cycle ${cycleId})` },
      { label: "Total Payable", value: `Rs ${(totalPayable / 10000000).toFixed(2)} Cr`, sub: "" },
      { label: "Total Deductions", value: `Rs ${(totalDeductions / 100000).toFixed(2)} L`, sub: "" },
      { label: "Net Payout", value: `Rs ${(netPayout / 10000000).toFixed(2)} Cr`, sub: "" },
    ],
    milkDistribution: [
      { name: "Cow Milk", value: Math.round((totalCow / totalType) * 100) },
      { name: "Buffalo Milk", value: Math.round((totalBuffalo / totalType) * 100) },
    ],
    cycleProgress: buildCycleProgressBands(),
  };
}

export function buildTrendData(state, fromMonthId = null) {
  const sortedCycles = [...state.cycles].sort(compareCycleDates);
  let dataSource = sortedCycles;
  
  // If a starting month is specified, find it and return from that point onwards
  if (fromMonthId) {
    // Try to find by cycle ID first
    const startIndex = sortedCycles.findIndex((cycle) => cycle.id === fromMonthId);
    if (startIndex !== -1) {
      dataSource = sortedCycles.slice(startIndex);
    } else {
      // Try to find by date string (YYYY-MM-DD)
      const dateObj = new Date(fromMonthId);
      if (!isNaN(dateObj.getTime())) {
        dataSource = sortedCycles.filter((cycle) => {
          const cycleDate = new Date(cycle.start || cycle.startDate || 0);
          return cycleDate >= dateObj;
        });
      }
    }
  }
  
  // Return trend data from selected month onwards
  return dataSource.map((cycle) => {
    const rows = getOrCalculateCycleRows(state, cycle.id);
    return {
      month: formatCycleLabel(cycle),
      milkQty: rows.reduce((sum, row) => sum + Number(row.totalMilkQty || 0), 0),
      payout: rows.reduce((sum, row) => sum + Number(row.netPayable || 0), 0),
    };
  });
}

export function resetAccountModuleState() {
  const initial = createInitialState();
  saveAccountState(initial);
  return initial;
}
