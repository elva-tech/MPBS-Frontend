import { getModuleFromPath, getModuleToken } from "./authSession.js";
import { isDemoUnlockEnabled } from "./demoMode.js";

const rawApiBase = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = (rawApiBase || "http://localhost:4000").replace(/\/+$/, "");

function backendUnavailableMessage() {
  return `Cannot reach backend at ${API_BASE}. Ensure the backend is running and VITE_API_BASE is correct.`;
}

function getToken() {
  const pathname = window.location?.pathname || "";
  const module = getModuleFromPath(pathname);
  return getModuleToken(module) || localStorage.getItem("auth_token") || "";
}

function getUploadToken() {
  return getToken();
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? "" : getToken();
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(isDemoUnlockEnabled() ? { "X-Demo-Unlock": "1" } : {}),
          ...(fetchOptions.headers || {}),
        },
        ...fetchOptions,
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch (_) {
        // ignore parse errors
      }

      if (!res.ok) {
        let message = payload?.message || `Request failed (${res.status})`;
        if (res.status === 429) {
          message = payload?.message || "Too many requests. Please wait a moment and try again.";
        }

        // Add validation details if present
        if (payload?.issues && Array.isArray(payload.issues)) {
          const details = payload.issues.map(issue =>
            `${issue.path.join(".")}: ${issue.message}`
          ).join("; ");
          message += ` - ${details}`;
        }

        const apiError = new Error(message);
        apiError.status = res.status;
        throw apiError;
      }

      return payload;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isNetworkError =
        error.message.includes("fetch") ||
        error.name === "TypeError" ||
        error.message.includes("Cannot reach backend");
      const isRetryableStatus = error.status === 429 || error.status >= 500;

      if ((isNetworkError || isRetryableStatus) && !isLastAttempt) {
        await sleep(retryDelay * (attempt + 1) * (isRetryableStatus ? 2 : 1));
        continue;
      }

      if (isNetworkError) {
        throw new Error(backendUnavailableMessage());
      }
      
      throw error;
    }
  }
}

export function fetchSocieties() {
  return request("/societies");
}

export function fetchBillingCycles() {
  return request("/billing-cycles");
}

export function getAccountsDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.cycleId) search.set("cycleId", params.cycleId);
  const qs = search.toString();
  return request(`/accounts/dashboard${qs ? `?${qs}` : ""}`);
}

export function createBillingCycle(body = {}) {
  return request("/billing-cycles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function runBillingCycle(cycleId) {
  return request(`/billing-cycles/${encodeURIComponent(cycleId)}/run`, { method: "POST" });
}

export function lockBillingCycle(cycleId) {
  return request(`/billing-cycles/${encodeURIComponent(cycleId)}/lock`, { method: "POST" });
}

export function getBillingSummary(cycleId) {
  return request(`/billing/${encodeURIComponent(cycleId)}`);
}

export function getSocietyBilling(cycleId, societyId) {
  return request(`/billing/${encodeURIComponent(cycleId)}/society/${encodeURIComponent(societyId)}`);
}

export function listAccountSchemes() {
  return request("/schemes");
}

export function createAccountScheme(body) {
  return request("/schemes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function toggleAccountScheme(schemeId) {
  return request(`/schemes/${encodeURIComponent(schemeId)}/toggle`, { method: "POST" });
}

export function listAccountClaims(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.billingCycleId) search.set("billingCycleId", params.billingCycleId);
  const qs = search.toString();
  return request(`/accounts/claims${qs ? `?${qs}` : ""}`);
}

export function createAccountClaim(body) {
  return request("/accounts/claims", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAccountClaim(id, body) {
  return request(`/accounts/claims/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAccountClaim(id) {
  return request(`/accounts/claims/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listAccountRecoverables(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  const qs = search.toString();
  return request(`/accounts/recoverables${qs ? `?${qs}` : ""}`);
}

export function createAccountRecoverable(body) {
  return request("/accounts/recoverables", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAccountRecoverable(id, body) {
  return request(`/accounts/recoverables/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAccountRecoverable(id) {
  return request(`/accounts/recoverables/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getAccountInvoice(societyBillingId) {
  return request(`/invoice/${encodeURIComponent(societyBillingId)}`);
}

export function getAccountPayoutReport(params = {}) {
  const search = new URLSearchParams();
  if (params.cycleId) search.set("cycleId", params.cycleId);
  if (params.societyId) search.set("societyId", params.societyId);
  const qs = search.toString();
  return request(`/reports/payout${qs ? `?${qs}` : ""}`);
}

export function getAccountDeductionsReport(params = {}) {
  const search = new URLSearchParams();
  if (params.cycleId) search.set("cycleId", params.cycleId);
  const qs = search.toString();
  return request(`/reports/deductions${qs ? `?${qs}` : ""}`);
}

export function getAccountSchemesReport() {
  return request("/reports/schemes");
}

export function getAccountReportSummary(params = {}) {
  const search = new URLSearchParams();
  if (params.cycleId) search.set("cycleId", params.cycleId);
  const qs = search.toString();
  return request(`/reports/summary${qs ? `?${qs}` : ""}`);
}

export function listDairyShipments(params = {}) {
  const search = new URLSearchParams();
  if (params.dairyId) search.set("dairyId", params.dairyId);
  if (params.dairyUnit) search.set("dairyUnit", params.dairyUnit);
  if (params.date) search.set("date", params.date);
  const qs = search.toString();
  return request(`/dairy/shipments${qs ? `?${qs}` : ""}`);
}

export function getDairyShipment(id) {
  return request(`/dairy/shipments/${encodeURIComponent(id)}`);
}

export function updateDairyShipment(id, body) {
  return request(`/dairy/shipments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function finalizeDairyShipment(id, body) {
  return request(`/dairy/shipments/${encodeURIComponent(id)}/finalize`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getDairyModuleReports(params = {}) {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const qs = search.toString();
  return request(`/dairy/reports${qs ? `?${qs}` : ""}`);
}

export function getMilkSessionStatus(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.date) search.set("date", params.date);
  if (params.session) search.set("session", params.session);
  const qs = search.toString();
  return request(`/milk-entries/session-status${qs ? `?${qs}` : ""}`);
}

export function getMilkEntries(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.date) search.set("date", params.date);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.session) search.set("session", params.session);
  const qs = search.toString();
  return request(`/milk-entries${qs ? `?${qs}` : ""}`);
}

export function fetchRateAndAmount(body) {
  return request("/rates/calc", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createMilkEntries(body) {
  return request("/milk-entries", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createVerification(body) {
  return request("/verifications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listVerifications(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.date) search.set("date", params.date);
  if (params.session) search.set("session", params.session);
  const qs = search.toString();
  return request(`/verifications${qs ? `?${qs}` : ""}`);
}

export function getSocietyDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const qs = search.toString();
  return request(`/dashboards/society${qs ? `?${qs}` : ""}`);
}

export function getBmcDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.bmcId) search.set("bmcId", params.bmcId);
  if (params.date) search.set("date", params.date);
  const qs = search.toString();
  return request(`/dashboards/bmc${qs ? `?${qs}` : ""}`);
}

export function getAdminDashboard() {
  return request("/dashboards/admin");
}

export function getDairyDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.dairyUnit) search.set("dairyUnit", params.dairyUnit);
  if (params.dairyId) search.set("dairyId", params.dairyId);
  if (params.date) search.set("date", params.date);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.session) search.set("session", params.session);
  const qs = search.toString();
  return request(`/dashboards/dairy${qs ? `?${qs}` : ""}`);
}

export function login(body) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

export function fetchBmcUnits() {
  return request("/auth/bmc-units", { skipAuth: true });
}

export function listProducts(params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return request(`/procurement/products${qs ? `?${qs}` : ""}`);
}

export function createProduct(body) {
  return request("/procurement/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(id, body) {
  return request(`/procurement/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function listRequests(params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.type) search.set("type", params.type);
  const qs = search.toString();
  return request(`/requests${qs ? `?${qs}` : ""}`);
}

export function listMyRequests(params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.type) search.set("type", params.type);
  const qs = search.toString();
  return request(`/requests/mine${qs ? `?${qs}` : ""}`);
}

export function updateRequest(id, body) {
  return request(`/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function cleanRequestBody(body = {}) {
  const payload = { ...body };
  if (!payload.userId) delete payload.userId;
  return payload;
}

export function createRequest(body) {
  return request("/requests", {
    method: "POST",
    body: JSON.stringify(cleanRequestBody(body)),
  });
}

export function listNotifications(params = {}) {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  const qs = search.toString();
  return request(`/notifications${qs ? `?${qs}` : ""}`);
}

export async function listNotificationsForRole(role) {
  if (!role || role === "All") {
    return listNotifications({ role: "All" });
  }

  const [roleRes, allRes] = await Promise.all([
    listNotifications({ role }),
    listNotifications({ role: "All" }),
  ]);

  const mergedMap = new Map();
  for (const item of [...(roleRes?.data || []), ...(allRes?.data || [])]) {
    mergedMap.set(item._id, item);
  }

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { data: merged };
}

export function createNotification(body) {
  return request("/notifications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function markNotificationAsRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function archiveNotification(notificationId) {
  return request(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

export async function uploadNotificationFile(file) {
  const token = getUploadToken();
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${API_BASE}/uploads/notification`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const payload = await readJsonSafely(res);
    if (!res.ok) throw new Error(payload?.message || "Upload failed");
    return payload;
  } catch (error) {
    const isNetworkError = error?.message?.includes("fetch") || error?.name === "TypeError";
    if (isNetworkError) {
      throw new Error(backendUnavailableMessage());
    }
    throw error;
  }
}

export async function uploadComplaintFile(file) {
  const token = getUploadToken();
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${API_BASE}/uploads/complaint`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const payload = await readJsonSafely(res);
    if (!res.ok) throw new Error(payload?.message || "Upload failed");
    return payload;
  } catch (error) {
    const isNetworkError = error?.message?.includes("fetch") || error?.name === "TypeError";
    if (isNetworkError) {
      throw new Error(backendUnavailableMessage());
    }
    throw error;
  }
}

export function listUsers() {
  return request("/admin/users");
}

export function getHierarchyOptions() {
  return request("/admin/hierarchy-options");
}

export function createUser(body) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUserAuth(id, body) {
  return request(`/admin/users/${id}/auth`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function createDispatch(body) {
  return request("/procurement/dispatches", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getReportMilkProcured(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  const qs = search.toString();
  return request(`/reports/milk-procured${qs ? `?${qs}` : ""}`);
}

export function getReportMilkRejected(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.bmcId) search.set("bmcId", params.bmcId);
  const qs = search.toString();
  return request(`/reports/milk-rejected${qs ? `?${qs}` : ""}`);
}

export function getReportOverheads(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.bmcId) search.set("bmcId", params.bmcId);
  const qs = search.toString();
  return request(`/reports/overheads${qs ? `?${qs}` : ""}`);
}

export function getReportQuality(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  const qs = search.toString();
  return request(`/reports/quality${qs ? `?${qs}` : ""}`);
}
