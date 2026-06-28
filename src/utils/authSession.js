const MODULE_KEYS = {
  society: {
    flag: "society_auth",
    token: "society_token",
    role: "society_role",
    extras: ["society_name", "society_id", "society_user_id"],
  },
  admin: {
    flag: "admin_auth",
    token: "admin_token",
    role: "admin_role",
    extras: ["admin_name"],
  },
  bmc: {
    flag: "bmc_auth",
    token: "bmc_token",
    role: "bmc_role",
    extras: ["bmc_name", "bmc_id", "bmc_user_id"],
  },
  dairy: {
    flag: "dairy_auth",
    token: "dairy_token",
    role: "dairy_role",
    extras: ["dairy_name", "dairy_id", "dairy_bmc_id", "dairy_unit"],
  },
  account: {
    flag: "account_auth",
    token: "account_token",
    role: "account_role",
    extras: ["account_name", "account_id"],
  },
  procurement: {
    flag: "procurement_auth",
    token: "procurement_token",
    role: "procurement_role",
    extras: ["procurement_name", "procurement_id"],
  },
  audit: {
    flag: "audit_auth",
    token: "audit_token",
    role: "audit_role",
    extras: ["audit_name", "audit_id", "audit_user_id"],
  },
};

export function isLoginPath(pathname = "") {
  if (!pathname) return false;
  if (pathname === "/login" || pathname === "/forgot-password") return true;
  if (pathname.startsWith("/login/")) return true;
  return /\/login$/.test(pathname);
}

export function getModuleFromLoginPath(pathname = "") {
  if (!isLoginPath(pathname)) return null;
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/login/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/dairy/login") || pathname.startsWith("/login/dairy")) {
    return "dairy";
  }
  if (pathname.startsWith("/bmc/login") || pathname.startsWith("/login/bmc")) {
    return "bmc";
  }
  if (pathname.startsWith("/audit/login")) return "audit";
  if (pathname.startsWith("/account/login") || pathname.startsWith("/login/account")) {
    return "account";
  }
  if (
    pathname.startsWith("/procurement/login") ||
    pathname.startsWith("/login/procurement") ||
    pathname.startsWith("/p-and-i/login")
  ) {
    return "procurement";
  }
  return "society";
}

export function getModuleFromPath(pathname = "") {
  if (isLoginPath(pathname)) return null;
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/bmc")) return "bmc";
  if (pathname.startsWith("/procurement") || pathname.startsWith("/p-and-i")) {
    return "procurement";
  }
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/dairy")) return "dairy";
  if (pathname.startsWith("/audit")) return "audit";
  return "society";
}

export function prepareModuleLogin(module) {
  if (!module) return;
  clearModuleSession(module);
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
}

/** @deprecated Prefer module-scoped sessions; clearing other modules logs out open tabs. */
export function clearCrossModuleAuth(activeModule) {
  for (const [name, keys] of Object.entries(MODULE_KEYS)) {
    if (name === activeModule) continue;
    localStorage.removeItem(keys.flag);
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.role);
    keys.extras.forEach((k) => localStorage.removeItem(k));
  }
}

export function getModuleToken(module) {
  const keys = MODULE_KEYS[module];
  if (!keys) return "";
  return localStorage.getItem(keys.token) || "";
}

export function hasModuleSession(module, expectedRole) {
  const keys = MODULE_KEYS[module];
  if (!keys) return false;
  const flagOk = localStorage.getItem(keys.flag) === "true";
  const role =
    localStorage.getItem(keys.role) || localStorage.getItem("user_role") || "";
  const token = localStorage.getItem(keys.token) || "";
  return flagOk && role === expectedRole && Boolean(token);
}

export function clearModuleSession(module) {
  const keys = MODULE_KEYS[module];
  if (!keys) return;
  localStorage.removeItem(keys.flag);
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.role);
  keys.extras.forEach((k) => localStorage.removeItem(k));
}
