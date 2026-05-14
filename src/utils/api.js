const rawApiBase = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = (rawApiBase || "http://localhost:4000").replace(/\/+$/, "");

function backendUnavailableMessage() {
  return `Cannot reach backend at ${API_BASE}. Ensure the backend is running and VITE_API_BASE is correct.`;
}

function getToken() {
  const pathname = window.location?.pathname || "";

  if (pathname.startsWith("/admin")) {
    return localStorage.getItem("admin_token") || localStorage.getItem("auth_token") || "";
  }

  if (pathname.startsWith("/bmc")) {
    return localStorage.getItem("bmc_token") || localStorage.getItem("auth_token") || "";
  }

  return localStorage.getItem("society_token") || localStorage.getItem("auth_token") || "";
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
  const token = getToken();
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
        ...options,
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch (_) {
        // ignore parse errors
      }

      if (!res.ok) {
        let message = payload?.message || `Request failed (${res.status})`;
        
        // Add validation details if present
        if (payload?.issues && Array.isArray(payload.issues)) {
          const details = payload.issues.map(issue => 
            `${issue.path.join('.')}: ${issue.message}`
          ).join('; ');
          message += ` - ${details}`;
        }
        
        throw new Error(message);
      }

      return payload;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isNetworkError = error.message.includes('fetch') || error.name === 'TypeError';
      
      if (isNetworkError && !isLastAttempt) {
        console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
        await sleep(retryDelay * (attempt + 1));
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
  const qs = search.toString();
  return request(`/dashboards/bmc${qs ? `?${qs}` : ""}`);
}

export function getAdminDashboard() {
  return request("/dashboards/admin");
}

export function getDairyDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.dairyUnit) search.set("dairyUnit", params.dairyUnit);
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

export function createRequest(body) {
  return request("/requests", {
    method: "POST",
    body: JSON.stringify(body),
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
