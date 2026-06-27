import { config } from "../config/env.js";

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = LOG_LEVELS[config.logLevel] ?? LOG_LEVELS.info;

function stringifyMeta(meta = {}) {
  const cleanMeta = { ...meta };
  if (cleanMeta.error instanceof Error) {
    cleanMeta.error = {
      name: cleanMeta.error.name,
      message: cleanMeta.error.message,
      stack: cleanMeta.error.stack,
    };
  }
  // Sanitize sensitive fields
  if (cleanMeta.password) delete cleanMeta.password;
  if (cleanMeta.token) cleanMeta.token = "[REDACTED]";
  if (cleanMeta.authorization) cleanMeta.authorization = "[REDACTED]";
  return cleanMeta;
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLogLevel;
}

function shouldSample() {
  return Math.random() <= config.requestLogSampleRate;
}

export function log(level, event, meta = {}) {
  if (!shouldLog(level)) return;

  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...stringifyMeta(meta),
  });

  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function logDebug(event, meta = {}) {
  log("debug", event, meta);
}

export function logInfo(event, meta = {}) {
  log("info", event, meta);
}

export function logWarn(event, meta = {}) {
  log("warn", event, meta);
}

export function logError(event, meta = {}) {
  log("error", event, meta);
}

export function logRequest(method, path, statusCode, durationMs, meta = {}) {
  if (!shouldSample()) return;

  log("info", "http.request", {
    method,
    path,
    statusCode,
    durationMs: Number(durationMs.toFixed(2)),
    ...meta,
  });
}

export function logAudit(action, userId, resource, changes, meta = {}) {
  log("info", "audit.log", {
    action,
    userId,
    resource,
    changes,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}