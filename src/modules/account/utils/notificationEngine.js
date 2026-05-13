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

export const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "info",
    title: "Billing Cycle Started",
    desc: "New billing cycle Dec 2025 has started",
    time: "5 min ago",
    read: false,
    actionable: true,
  },
  {
    id: 2,
    type: "warning",
    title: "Payment Pending",
    desc: "Society payment verification pending for Nov cycle",
    time: "1 hour ago",
    read: false,
    actionable: false,
  },
];
