import { randomUUID } from "node:crypto";
import { logInfo } from "../utils/logger.js";

function getRequestIdFromHeader(headerValue) {
  if (typeof headerValue !== "string") return "";
  return headerValue.trim();
}

export function requestIdMiddleware(req, res, next) {
  const headerId = getRequestIdFromHeader(req.headers["x-request-id"]);
  const requestId = headerId || randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

export function requestLoggerMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logInfo("http.request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      contentLength: Number(res.getHeader("content-length") || 0),
    });
  });

  next();
}