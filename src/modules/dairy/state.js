import {
  finalizeDairyShipment,
  getDairyModuleReports,
  listDairyShipments,
  updateDairyShipment,
} from "../../utils/api";

const ACTIVE_SHIPMENT_KEY = "dairy_active_shipment_id";
export const QUALITY_MIN_FAT = 3.5;
export const QUALITY_MIN_SNF = 8.5;
export const QUANTITY_TOLERANCE_PERCENT = 0.5;

const STATUS_LABELS = {
  pending: "Pending",
  in_verification: "In Verification",
  approved: "Approved",
  penalty: "Penalised",
  rejected: "Rejected",
};

function withNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function findQualityValue(qualityRows = [], parameterName = "") {
  const match = qualityRows.find(
    (item) => String(item.parameter || "").trim().toLowerCase() === parameterName.trim().toLowerCase()
  );
  const raw = String(match?.dairyTest || "").replace(/°c/i, "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function isShipmentGoodQuality(shipment) {
  const fat = findQualityValue(shipment?.quality || [], "fat");
  const snf = findQualityValue(shipment?.quality || [], "snf");
  if (!Number.isFinite(fat) || !Number.isFinite(snf)) return false;
  return fat >= QUALITY_MIN_FAT && snf >= QUALITY_MIN_SNF;
}

export function setActiveShipmentId(shipmentId) {
  localStorage.setItem(ACTIVE_SHIPMENT_KEY, shipmentId);
}

export function getActiveShipmentId() {
  return localStorage.getItem(ACTIVE_SHIPMENT_KEY) || "";
}

export function calculateTotals(stops = []) {
  return stops.reduce(
    (acc, stop) => {
      const expected = withNumber(stop.expected);
      const received = withNumber(stop.received);
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

export function getShipmentStatusLabel(status) {
  return STATUS_LABELS[status] || "Pending";
}

function getDairyId() {
  return localStorage.getItem("dairy_id") || "";
}

export async function fetchShipments(params = {}) {
  const dairyId = params.dairyId || getDairyId();
  const date = params.date || new Date().toISOString().slice(0, 10);
  const payload = await listDairyShipments({ dairyId, date });
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchActiveShipment(shipments = []) {
  const activeId = getActiveShipmentId();
  if (activeId) {
    const match = shipments.find((item) => item.id === activeId);
    if (match) return match;
  }
  return shipments[0] || null;
}

export async function fetchLatestDiscrepancyShipment(shipments = []) {
  const candidates = shipments.filter((item) => {
    const totals = calculateTotals(item.stops || []);
    return item.status === "rejected" || item.status === "penalty" || item.status === "in_verification" || totals.shortage > 0;
  });
  if (!candidates.length) return shipments[0] || null;
  return candidates[0];
}

export async function patchShipment(shipmentId, body) {
  const payload = await updateDairyShipment(shipmentId, body);
  return payload?.data || null;
}

export async function finalizeShipmentDecision(shipmentId, decision, discrepancy = null) {
  const payload = await finalizeDairyShipment(shipmentId, { decision, discrepancy });
  return payload?.data || null;
}

export async function fetchDairyReports(params = {}) {
  const payload = await getDairyModuleReports(params);
  return payload?.data || { summary: [], shipments: [] };
}

export function getDashboardMetricsFromShipments(shipments = []) {
  const totals = shipments.reduce(
    (acc, item) => {
      const itemTotals = calculateTotals(item.stops || []);
      return {
        milkReceived: acc.milkReceived + itemTotals.received,
        shortages: acc.shortages + itemTotals.shortage,
      };
    },
    { milkReceived: 0, shortages: 0 }
  );

  return {
    milkReceived: totals.milkReceived,
    tankerCount: shipments.length,
    pendingCount: shipments.filter((item) => item.status === "pending" || item.status === "in_verification").length,
    totalShortage: totals.shortages,
    approvedCount: shipments.filter((item) => item.status === "approved").length,
    rejectedOrPenalisedCount: shipments.filter((item) => item.status === "rejected" || item.status === "penalty").length,
  };
}
