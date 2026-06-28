import {
  createAccountClaim,
  createAccountRecoverable,
  createAccountScheme,
  createBillingCycle,
  deleteAccountClaim,
  deleteAccountRecoverable,
  fetchBillingCycles,
  fetchSocieties,
  getBillingSummary,
  listAccountClaims,
  listAccountRecoverables,
  listAccountSchemes,
  lockBillingCycle,
  runBillingCycle,
  toggleAccountScheme,
  updateAccountClaim,
  updateAccountRecoverable,
} from "../../utils/api";

const SELECTION_KEY = "account_module_selections_v1";

function readSelections() {
  try {
    const raw = window.localStorage.getItem(SELECTION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSelections(selections) {
  window.localStorage.setItem(SELECTION_KEY, JSON.stringify(selections));
}

function mapCycle(cycle = {}) {
  const mongoId = String(cycle._id || cycle.mongoId || cycle.id || "");
  const code = cycle.code || mongoId;
  return {
    id: code,
    mongoId,
    code,
    start: cycle.startDate || cycle.start || "",
    end: cycle.endDate || cycle.end || "",
    status: cycle.status || "OPEN",
  };
}

function findCycle(state, cycleKey) {
  return state.cycles.find((cycle) => cycle.id === cycleKey || cycle.mongoId === cycleKey || cycle.code === cycleKey);
}

function resolveCycleId(state, cycleKey) {
  const cycle = findCycle(state, cycleKey);
  return cycle?.mongoId || cycleKey;
}

function mapScheme(scheme = {}) {
  return {
    id: String(scheme._id || scheme.id),
    name: scheme.name,
    type: scheme.type,
    calculationType: scheme.calculationType,
    value: Number(scheme.value || 0),
    isActive: scheme.isActive !== false,
    appliesTo: Array.isArray(scheme.appliesTo) && scheme.appliesTo.length ? scheme.appliesTo : ["ALL"],
    condition: scheme.condition || null,
  };
}

function mapClaim(claim = {}, cycles = []) {
  const billingCycleId = String(claim.billingCycleId || "");
  const cycle = cycles.find((item) => item.mongoId === billingCycleId);
  return {
    id: String(claim._id || claim.id),
    cycleId: cycle?.id || billingCycleId,
    billingCycleId,
    societyId: claim.societyId,
    reason: claim.type || claim.description || "Claim",
    amount: Number(claim.amount || 0),
    status: claim.status || "APPLIED",
    createdAt: claim.createdAt,
  };
}

function mapRecoverable(item = {}) {
  return {
    id: String(item._id || item.id),
    societyId: item.societyId,
    reason: item.reason || "Recoverable",
    totalAmount: Number(item.totalAmount || 0),
    remainingAmount: Number(item.remainingAmount || 0),
    installmentAmount: Number(item.installmentAmount || 0),
    status: item.status === "CLOSED" ? "CLOSED" : "ACTIVE",
    createdAt: item.createdAt,
  };
}

function mapBillingRow(billing = {}, lineItems = []) {
  const societyBillingId = String(billing._id || billing.societyBillingId || "");
  const items = lineItems.filter(
    (item) =>
      String(item.societyBillingId || "") === societyBillingId ||
      item.societyId === billing.societyId
  );

  const claims = items.filter((item) => item.type === "CLAIM");
  const recoverables = items.filter((item) => item.type === "RECOVERABLE");
  const schemes = items.filter((item) => item.type === "SCHEME");

  return {
    societyId: billing.societyId,
    societyBillingId,
    cycleId: billing.billingCycleId,
    totalMilkQty: Number(billing.totalMilkQty || 0),
    milkAmount: Number(billing.milkAmount || 0),
    totalClaims: Number(billing.totalClaims || 0),
    totalRecoverables: Number(billing.totalRecoverables || 0),
    totalSchemeDeductions: Number(billing.totalSchemeDeductions || 0),
    totalSchemeBenefits: Number(billing.totalSchemeBenefits || 0),
    transportPenalty: Number(billing.transportPenalty || 0),
    netPayable: Number(billing.netPayable || 0),
    breakdown: {
      claims: claims.map((item) => ({
        id: item.referenceId,
        reason: item.description,
        amount: Number(item.amount || 0),
        status: "APPLIED",
      })),
      recoverables: recoverables.map((item) => ({
        id: item.referenceId,
        reason: item.description,
        amount: Math.abs(Number(item.amount || 0)),
      })),
      schemes: schemes.map((item) => ({
        referenceId: item.referenceId,
        description: item.description,
        amount: Number(item.amount || 0),
      })),
      schemeDeductions: schemes.filter((item) => Number(item.amount || 0) < 0),
    },
  };
}

export async function fetchAccountState() {
  const selections = readSelections();
  const [societiesResult, cyclesResult, schemesResult, claimsResult, recoverablesResult] = await Promise.allSettled([
    fetchSocieties(),
    fetchBillingCycles(),
    listAccountSchemes(),
    listAccountClaims(),
    listAccountRecoverables(),
  ]);

  const societiesPayload = societiesResult.status === "fulfilled" ? societiesResult.value : null;
  const cyclesPayload = cyclesResult.status === "fulfilled" ? cyclesResult.value : null;
  const schemesPayload = schemesResult.status === "fulfilled" ? schemesResult.value : null;
  const claimsPayload = claimsResult.status === "fulfilled" ? claimsResult.value : null;
  const recoverablesPayload = recoverablesResult.status === "fulfilled" ? recoverablesResult.value : null;

  const societies = (societiesPayload?.data || [])
    .map((society) => ({
      id: society.societyId || society.id,
      name: society.societyName || society.name || society.societyId,
      district: society.district || "",
      active: society.active !== false,
    }))
    .filter((society) => society.id);

  const cycles = (cyclesPayload?.data || []).map(mapCycle).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const schemes = (schemesPayload?.data || []).map(mapScheme);
  const claims = (claimsPayload?.data || []).map((claim) => mapClaim(claim, cycles));
  const recoverables = (recoverablesPayload?.data || []).map(mapRecoverable);

  const selectedCycleId =
    (selections.selectedCycleId && cycles.some((cycle) => cycle.id === selections.selectedCycleId) && selections.selectedCycleId) ||
    cycles.at(-1)?.id ||
    "";
  const selectedSocietyId =
    (selections.selectedSocietyId && societies.some((society) => society.id === selections.selectedSocietyId) && selections.selectedSocietyId) ||
    societies[0]?.id ||
    "";

  const billingResults = {};
  for (const cycle of cycles) {
    try {
      const summary = await getBillingSummary(cycle.mongoId || cycle.id);
      const billings = summary?.data?.billings || [];
      const lineItems = summary?.data?.lineItems || [];
      billingResults[cycle.id] = billings.map((billing) => mapBillingRow(billing, lineItems));
    } catch {
      billingResults[cycle.id] = [];
    }
  }

  const state = {
    selectedCycleId,
    selectedSocietyId,
    societies,
    cycles,
    schemes,
    claims,
    recoverables,
    billingResults,
    milkData: [],
    invoiceDispatch: selections.invoiceDispatch || [],
    recoverableTransactions: [],
    payments: [],
    auditLogs: [],
  };

  writeSelections({ selectedCycleId, selectedSocietyId, invoiceDispatch: state.invoiceDispatch });
  return state;
}

export function setAccountSelections({ cycleId, societyId }) {
  const selections = readSelections();
  if (cycleId) selections.selectedCycleId = cycleId;
  if (societyId) selections.selectedSocietyId = societyId;
  writeSelections(selections);
  return selections;
}

export function markInvoiceSentLocal(cycleId, societyId) {
  const selections = readSelections();
  const invoiceDispatch = Array.isArray(selections.invoiceDispatch) ? selections.invoiceDispatch : [];
  const exists = invoiceDispatch.some((item) => item.cycleId === cycleId && item.societyId === societyId);
  if (!exists) {
    invoiceDispatch.push({
      id: `INV_${Date.now()}`,
      cycleId,
      societyId,
      sentAt: new Date().toISOString(),
    });
  }
  selections.invoiceDispatch = invoiceDispatch;
  writeSelections(selections);
  return invoiceDispatch;
}

export async function createCycle() {
  const payload = await createBillingCycle({});
  const state = await fetchAccountState();
  const created = mapCycle(payload?.data || {});
  if (created.id) state.selectedCycleId = created.id;
  setAccountSelections({ cycleId: state.selectedCycleId });
  return { ok: true, message: `Cycle ${created.id || "created"} is ready.`, state };
}

export async function runCycleBilling(cycleKey) {
  const state = await fetchAccountState();
  const cycleId = resolveCycleId(state, cycleKey);
  const payload = await runBillingCycle(cycleId);
  const next = await fetchAccountState();
  next.selectedCycleId = findCycle(state, cycleKey)?.id || next.selectedCycleId;
  setAccountSelections({ cycleId: next.selectedCycleId });
  return {
    ok: true,
    message: payload?.message || `Billing calculated for cycle ${cycleKey}.`,
    state: next,
  };
}

export async function lockCycleBilling(cycleKey) {
  const state = await fetchAccountState();
  const cycleId = resolveCycleId(state, cycleKey);
  const payload = await lockBillingCycle(cycleId);
  const next = await fetchAccountState();
  next.selectedCycleId = findCycle(state, cycleKey)?.id || next.selectedCycleId;
  setAccountSelections({ cycleId: next.selectedCycleId });
  return {
    ok: true,
    message: payload?.message || `Cycle ${cycleKey} locked successfully.`,
    state: next,
  };
}

export async function addSchemeRecord(payload) {
  await createAccountScheme(payload);
  const state = await fetchAccountState();
  return { ok: true, message: `Scheme "${payload.name}" added.`, state };
}

export async function toggleSchemeRecord(schemeId) {
  await toggleAccountScheme(schemeId);
  const state = await fetchAccountState();
  const scheme = state.schemes.find((item) => item.id === schemeId);
  const status = scheme?.isActive ? "enabled" : "disabled";
  return { ok: true, message: `Scheme "${scheme?.name || schemeId}" ${status}.`, state };
}

export async function deleteSchemeRecord(schemeId) {
  const state = await fetchAccountState();
  const scheme = state.schemes.find((item) => item.id === schemeId);
  if (!scheme) return { ok: false, message: "Scheme not found." };
  if (scheme.isActive) await toggleAccountScheme(schemeId);
  const next = await fetchAccountState();
  return { ok: true, message: `Scheme "${scheme.name}" deactivated.`, state: next };
}

export async function addAdjustmentRecord(payload) {
  const state = await fetchAccountState();
  const cycleMongoId = resolveCycleId(state, payload.cycleId);

  if (payload.kind === "CLAIM") {
    await createAccountClaim({
      societyId: payload.societyId || "ALL",
      billingCycleId: cycleMongoId,
      type: payload.reason || "Manual claim",
      amount: Number(payload.amount || 0),
      status: "APPLIED",
      description: payload.reason || "",
    });
  } else {
    const amount = Number(payload.amount || 0);
    await createAccountRecoverable({
      societyId: payload.societyId || "ALL",
      reason: payload.reason || "Manual recoverable",
      totalAmount: amount,
      remainingAmount: amount,
      installmentAmount: Number(payload.installmentAmount || amount),
      status: "ACTIVE",
    });
  }

  const next = await fetchAccountState();
  return { ok: true, message: `${payload.kind === "CLAIM" ? "Claim" : "Recoverable"} added successfully.`, state: next };
}

export async function deleteAdjustmentRecord(kind, adjustmentId) {
  if (kind === "CLAIM") {
    await deleteAccountClaim(adjustmentId);
  } else {
    await deleteAccountRecoverable(adjustmentId);
  }
  const state = await fetchAccountState();
  return { ok: true, message: kind === "CLAIM" ? "Claim deleted." : "Recoverable deleted.", state };
}

export async function toggleAdjustmentRecord(kind, adjustmentId) {
  const state = await fetchAccountState();
  if (kind === "CLAIM") {
    const claim = state.claims.find((item) => item.id === adjustmentId);
    if (!claim) return { ok: false, message: "Claim not found." };
    const status = claim.status === "APPLIED" ? "PENDING" : "APPLIED";
    await updateAccountClaim(adjustmentId, { status });
  } else {
    const recoverable = state.recoverables.find((item) => item.id === adjustmentId);
    if (!recoverable) return { ok: false, message: "Recoverable not found." };
    const status = recoverable.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    await updateAccountRecoverable(adjustmentId, { status });
  }
  const next = await fetchAccountState();
  return { ok: true, message: "Status updated.", state: next };
}
