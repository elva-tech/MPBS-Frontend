export const DEMO_UNLOCK_KEY = "mpbs_demo_unlock";

export function isDemoUnlockEnabled() {
  return localStorage.getItem(DEMO_UNLOCK_KEY) === "1";
}

export function setDemoUnlockEnabled(enabled) {
  localStorage.setItem(DEMO_UNLOCK_KEY, enabled ? "1" : "0");
}
