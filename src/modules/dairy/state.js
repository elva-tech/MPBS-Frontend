import { qualityTest, routeSheetRows, tankerDetails } from "./mockData";

const SHIPMENTS_KEY = "dairy_shipments_v1";
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
  return withNumber(match?.dairyTest, NaN);
}

export function isShipmentGoodQuality(shipment) {
  const fat = findQualityValue(shipment?.quality || [], "fat");
  const snf = findQualityValue(shipment?.quality || [], "snf");
  if (!Number.isFinite(fat) || !Number.isFinite(snf)) return false;
  return fat >= QUALITY_MIN_FAT && snf >= QUALITY_MIN_SNF;
}

function buildDefaultShipments() {
  const grouped = new Map();
  const today = new Date().toISOString().slice(0, 10);

  routeSheetRows.forEach((row) => {
    const shipmentId = `${row.tankerId}-${row.route}`;
    if (!grouped.has(shipmentId)) {
      grouped.set(shipmentId, {
        id: shipmentId,
        tankerId: row.tankerId,
        route: row.route,
        arrivalTime: tankerDetails.arrivalTime || "-",
        transporter: tankerDetails.transporter || "-",
        status: "pending",
        shift: "Morning",
        receivedDate: today,
        updatedAt: new Date().toISOString(),
        stops: [],
        quality: qualityTest.map((item) => ({
          parameter: item.parameter,
          routeSheet: String(item.routeSheet),
          dairyTest: String(item.dairyTest || item.routeSheet),
        })),
        discrepancy: null,
      });
    }

    grouped.get(shipmentId).stops.push({
      bmc: row.bmc,
      societies: withNumber(row.societies),
      milkType: row.milkType,
      expected: withNumber(row.expected),
      received: withNumber(row.expected),
    });
  });

  return Array.from(grouped.values());
}

function normalizeShipment(item) {
  if (!item || typeof item !== "object") return null;
  return {
    ...item,
    status: item.status || "pending",
    shift: item.shift || "Morning",
    receivedDate: item.receivedDate || new Date().toISOString().slice(0, 10),
    stops: Array.isArray(item.stops) ? item.stops : [],
    quality: Array.isArray(item.quality) ? item.quality : [],
  };
}

function readShipments() {
  try {
    const raw = localStorage.getItem(SHIPMENTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function writeShipments(shipments) {
  localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
}

export function getShipments() {
  const existing = readShipments();
  if (existing && existing.length) {
    const normalized = existing.map(normalizeShipment).filter(Boolean);
    writeShipments(normalized);
    return normalized;
  }
  const defaults = buildDefaultShipments();
  writeShipments(defaults);
  return defaults;
}

export function setActiveShipmentId(shipmentId) {
  localStorage.setItem(ACTIVE_SHIPMENT_KEY, shipmentId);
}

export function getActiveShipmentId() {
  return localStorage.getItem(ACTIVE_SHIPMENT_KEY) || "";
}

export function getShipmentById(shipmentId) {
  return getShipments().find((item) => item.id === shipmentId) || null;
}

export function getActiveShipment() {
  const activeId = getActiveShipmentId();
  if (!activeId) return getShipments()[0] || null;
  return getShipmentById(activeId) || getShipments()[0] || null;
}

export function updateShipment(shipmentId, updater) {
  const shipments = getShipments();
  const nextShipments = shipments.map((item) => {
    if (item.id !== shipmentId) return item;
    const next = updater(item);
    return {
      ...next,
      updatedAt: new Date().toISOString(),
    };
  });
  writeShipments(nextShipments);
  return nextShipments.find((item) => item.id === shipmentId) || null;
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

export function getDashboardMetrics() {
  const shipments = getShipments();
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

export function getLatestDiscrepancyShipment() {
  const shipments = getShipments();
  const candidates = shipments.filter((item) => {
    const totals = calculateTotals(item.stops || []);
    return item.status === "rejected" || item.status === "penalty" || totals.shortage > 0;
  });
  if (!candidates.length) return getActiveShipment();
  return candidates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}

export function getShipmentStatusLabel(status) {
  return STATUS_LABELS[status] || "Pending";
}
