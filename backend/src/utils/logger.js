function stringifyMeta(meta = {}) {
  const cleanMeta = { ...meta };
  if (cleanMeta.error instanceof Error) {
    cleanMeta.error = {
      name: cleanMeta.error.name,
      message: cleanMeta.error.message,
      stack: cleanMeta.error.stack,
    };
  }
  return cleanMeta;
}

export function log(level, event, meta = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...stringifyMeta(meta),
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function logInfo(event, meta = {}) {
  log("info", event, meta);
}

export function logError(event, meta = {}) {
  log("error", event, meta);
}