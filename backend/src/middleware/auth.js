import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (roles.length === 0 || roles.includes(req.user.role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}
