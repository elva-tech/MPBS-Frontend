const STORAGE_KEY = "account_module_state_v1";

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialState() {
  return {
    selectedCycleId: "1-10",
    selectedSocietyId: "S001",
    societies: [
      { id: "S001", name: "Ballari Milk Society", district: "Ballari", active: true },
      { id: "S023", name: "Sandur Milk Society", district: "Ballari", active: true },
      { id: "S040", name: "Raichur Milk Society", district: "Raichur", active: true },
    ],
    cycles: [
      { id: "1-10", start: "2025-12-01", end: "2025-12-10", status: "CALCULATED" },
      { id: "11-20", start: "2025-12-11", end: "2025-12-20", status: "OPEN" },
      { id: "21-END", start: "2025-12-21", end: "2025-12-31", status: "OPEN" },
    ],
    milkData: [
      { cycleId: "1-10", societyId: "S001", qty: 120000, cowQty: 93600, buffaloQty: 26400, milkAmount: 461000, avgFat: 4.3, transportPenalty: 2000 },
      { cycleId: "1-10", societyId: "S023", qty: 98000, cowQty: 73500, buffaloQty: 24500, milkAmount: 372000, avgFat: 4.1, transportPenalty: 1000 },
      { cycleId: "1-10", societyId: "S040", qty: 87000, cowQty: 66120, buffaloQty: 20880, milkAmount: 331000, avgFat: 3.9, transportPenalty: 1500 },
      { cycleId: "11-20", societyId: "S001", qty: 118000, cowQty: 89680, buffaloQty: 28320, milkAmount: 452000, avgFat: 4.2, transportPenalty: 0 },
      { cycleId: "11-20", societyId: "S023", qty: 95000, cowQty: 71250, buffaloQty: 23750, milkAmount: 361000, avgFat: 4.0, transportPenalty: 0 },
      { cycleId: "11-20", societyId: "S040", qty: 85000, cowQty: 63750, buffaloQty: 21250, milkAmount: 322000, avgFat: 3.8, transportPenalty: 0 },
      { cycleId: "21-END", societyId: "S001", qty: 0, cowQty: 0, buffaloQty: 0, milkAmount: 0, avgFat: 0, transportPenalty: 0 },
      { cycleId: "21-END", societyId: "S023", qty: 0, cowQty: 0, buffaloQty: 0, milkAmount: 0, avgFat: 0, transportPenalty: 0 },
      { cycleId: "21-END", societyId: "S040", qty: 0, cowQty: 0, buffaloQty: 0, milkAmount: 0, avgFat: 0, transportPenalty: 0 },
    ],
    schemes: [
      { id: "SCH_01", name: "Raitha Trust", type: "DEDUCTION", calculationType: "PER_LITRE", value: 0.1, isActive: true, appliesTo: ["ALL"] },
      { id: "SCH_02", name: "High Fat Bonus", type: "INCENTIVE", calculationType: "PER_LITRE", value: 2, isActive: true, appliesTo: ["S001", "S023"] },
      { id: "SCH_03", name: "Festival Bonus", type: "FIXED", calculationType: "FIXED", value: 5000, isActive: false, appliesTo: ["S001"] },
      { id: "SCH_04", name: "SNF Incentive", type: "CONDITIONAL", calculationType: "CONDITION", value: 1, condition: { metric: "avgFat", op: ">", threshold: 4 }, isActive: true, appliesTo: ["S001", "S023", "S040"] },
    ],
    claims: [
      { id: "CLM_01", cycleId: "1-10", societyId: "S001", reason: "Festival Bonus", amount: 5000, status: "APPLIED", createdAt: new Date().toISOString() },
    ],
    recoverables: [
      { id: "REC_01", societyId: "S001", reason: "Mineral Mixture", totalAmount: 12000, remainingAmount: 12000, installmentAmount: 2000, status: "ACTIVE", createdAt: new Date().toISOString() },
      { id: "REC_02", societyId: "S023", reason: "Feed Supply", totalAmount: 8500, remainingAmount: 8500, installmentAmount: 1500, status: "ACTIVE", createdAt: new Date().toISOString() },
    ],
    recoverableTransactions: [],
    billingResults: {},
    payments: [],
    invoiceDispatch: [],
    auditLogs: [],
  };
}

function normalizeState(state) {
  const next = state || {};
  if (!next.cycles || !next.societies) return createInitialState();
  if (!next.billingResults) next.billingResults = {};
  if (!next.payments) next.payments = [];
  if (!next.claims) next.claims = [];
  if (!next.recoverables) next.recoverables = [];
  if (!next.recoverableTransactions) next.recoverableTransactions = [];
  if (!next.auditLogs) next.auditLogs = [];
  if (!next.invoiceDispatch) next.invoiceDispatch = [];
  if (!next.selectedCycleId) next.selectedCycleId = next.cycles[0]?.id || "1-10";
  if (!next.selectedSocietyId) next.selectedSocietyId = next.societies[0]?.id || "S001";
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

function getMilkRow(state, cycleId, societyId) {
  return state.milkData.find((item) => item.cycleId === cycleId && item.societyId === societyId);
}

function schemeAppliesToSociety(scheme, societyId) {
  return scheme.appliesTo?.includes("ALL") || scheme.appliesTo?.includes(societyId);
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
  const milkRow = getMilkRow(state, cycleId, societyId) || {
    qty: 0,
    milkAmount: 0,
    cowQty: 0,
    buffaloQty: 0,
    avgFat: 0,
    transportPenalty: 0,
  };

  const appliedClaims = state.claims.filter(
    (item) => item.cycleId === cycleId && item.societyId === societyId && item.status === "APPLIED"
  );
  const totalClaims = appliedClaims.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const activeSchemes = state.schemes.filter(
    (scheme) => scheme.isActive && schemeAppliesToSociety(scheme, societyId) && conditionPasses(scheme, milkRow)
  );

  let totalSchemeBenefits = 0;
  let totalSchemeDeductions = 0;

  const schemeLineItems = activeSchemes.map((scheme) => {
    const amount = calculateSchemeAmount(scheme, milkRow);
    if (scheme.type === "DEDUCTION") totalSchemeDeductions += amount;
    else totalSchemeBenefits += amount;
    return {
      type: "SCHEME",
      referenceId: scheme.id,
      description: scheme.name,
      amount: scheme.type === "DEDUCTION" ? -amount : amount,
    };
  });

  const activeRecoverables = state.recoverables.filter(
    (item) => item.societyId === societyId && item.status === "ACTIVE" && Number(item.remainingAmount || 0) > 0
  );
  const recoverableBreakdown = activeRecoverables.map((item) => ({
    id: item.id,
    amount: Math.min(Number(item.installmentAmount || 0), Number(item.remainingAmount || 0)),
    reason: item.reason,
  }));
  const totalRecoverables = recoverableBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const transportPenalty = Number(milkRow.transportPenalty || 0);

  const netPayable =
    Number(milkRow.milkAmount || 0) +
    totalClaims +
    totalSchemeBenefits -
    totalRecoverables -
    totalSchemeDeductions -
    transportPenalty;

  return {
    societyId,
    cycleId,
    totalMilkQty: Number(milkRow.qty || 0),
    milkAmount: Number(milkRow.milkAmount || 0),
    totalClaims,
    totalRecoverables,
    totalSchemeDeductions,
    totalSchemeBenefits,
    transportPenalty,
    netPayable: Math.max(0, Math.round(netPayable)),
    breakdown: {
      claims: appliedClaims,
      recoverables: recoverableBreakdown,
      schemes: schemeLineItems,
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
  const nextNumber = state.cycles.length + 1;
  const id = `${nextNumber * 10 - 9}-${nextNumber * 10}`;
  state.cycles.push({
    id,
    start: "2025-12-01",
    end: "2025-12-10",
    status: "OPEN",
  });
  state.selectedCycleId = id;

  for (const society of state.societies) {
    state.milkData.push({
      cycleId: id,
      societyId: society.id,
      qty: 0,
      cowQty: 0,
      buffaloQty: 0,
      milkAmount: 0,
      avgFat: 0,
      transportPenalty: 0,
    });
  }

  pushAudit(state, "CREATE_CYCLE", { cycleId: id });
  saveAccountState(state);
  return { ok: true, message: `Cycle ${id} created.`, state };
}

export function toggleScheme(schemeId) {
  const state = loadAccountState();
  const scheme = state.schemes.find((item) => item.id === schemeId);
  if (!scheme) return { ok: false, message: "Scheme not found." };
  scheme.isActive = !scheme.isActive;
  pushAudit(state, "TOGGLE_SCHEME", { schemeId, isActive: scheme.isActive });
  saveAccountState(state);
  return { ok: true, message: `Scheme "${scheme.name}" ${scheme.isActive ? "enabled" : "disabled"}.`, state };
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

export function addAdjustment(payload) {
  const state = loadAccountState();
  const amount = Number(payload.amount || 0);
  if (!amount || amount <= 0) return { ok: false, message: "Amount must be greater than zero." };

  if (payload.kind === "CLAIM") {
    state.claims.unshift({
      id: makeId("CLM"),
      cycleId: payload.cycleId,
      societyId: payload.societyId,
      reason: payload.reason || "Manual claim",
      amount,
      status: "APPLIED",
      createdAt: new Date().toISOString(),
    });
    pushAudit(state, "ADD_CLAIM", { societyId: payload.societyId, cycleId: payload.cycleId, amount });
  } else {
    const installment = Number(payload.installmentAmount || amount);
    state.recoverables.unshift({
      id: makeId("REC"),
      societyId: payload.societyId,
      reason: payload.reason || "Manual recoverable",
      totalAmount: amount,
      remainingAmount: amount,
      installmentAmount: installment,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    pushAudit(state, "ADD_RECOVERABLE", { societyId: payload.societyId, amount, installment });
  }

  saveAccountState(state);
  return { ok: true, message: `${payload.kind === "CLAIM" ? "Claim" : "Recoverable"} added successfully.`, state };
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

  const paidCycles = state.cycles.filter((cycle) => cycle.status === "PAID").length;
  const lockedCycles = state.cycles.filter((cycle) => cycle.status === "LOCKED").length;
  const openCycles = state.cycles.filter((cycle) => cycle.status === "OPEN").length;

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
    cycleProgress: [
      { step: "Paid", state: String(paidCycles) },
      { step: "Locked", state: String(lockedCycles) },
      { step: "Open", state: String(openCycles) },
    ],
  };
}

export function buildTrendData(state) {
  return state.cycles.slice(0, 6).map((cycle, idx) => {
    const rows = getOrCalculateCycleRows(state, cycle.id);
    return {
      month: `C${idx + 1}`,
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
