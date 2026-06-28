import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const JWT_ISSUER = "mpbs-api";
const JWT_AUDIENCE = "mpbs-client";

const JWT_SIGN_OPTIONS = {
  expiresIn: config.jwtExpiry,
  algorithm: "HS256",
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

const JWT_VERIFY_STRICT = {
  algorithms: ["HS256"],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

const JWT_VERIFY_LEGACY = {
  algorithms: ["HS256"],
};

const ROLE_ALIASES = {
  Audit: ["Audit", "Auditor"],
  Auditor: ["Audit", "Auditor"],
  Account: ["Account", "Accounts"],
  Accounts: ["Account", "Accounts"],
};

function roleMatches(userRole, allowedRole) {
  const aliases = ROLE_ALIASES[allowedRole] || [allowedRole];
  return aliases.includes(userRole);
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret, JWT_VERIFY_STRICT);
  } catch (strictError) {
    // Support tokens issued before issuer/audience enforcement.
    return jwt.verify(token, config.jwtSecret, JWT_VERIFY_LEGACY);
  }
}

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, JWT_SIGN_OPTIONS);
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    const expired = err?.name === "TokenExpiredError";
    return res.status(401).json({
      message: expired ? "Token expired" : "Invalid token",
    });
  }
}

export function authOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Ignore invalid tokens for public endpoints that accept optional auth.
  }
  return next();
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (roles.length === 0) return next();
    const userRole = req.user.role;
    if (roles.some((allowed) => roleMatches(userRole, allowed))) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}
