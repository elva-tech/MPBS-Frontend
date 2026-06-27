import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { config } from "./config/env.js";
import { createApp } from "./app.js";
import { logInfo, logError } from "./utils/logger.js";

const app = createApp();

const DB_CONNECT_MAX_RETRIES = Number(process.env.DB_CONNECT_MAX_RETRIES || 15);
const DB_CONNECT_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectDbWithRetry() {
  for (let attempt = 1; attempt <= DB_CONNECT_MAX_RETRIES; attempt += 1) {
    try {
      await connectDb();
      if (attempt > 1) {
        logInfo("db.connected.after_retry", { attempt });
      }
      return;
    } catch (error) {
      const message = error?.message || String(error);
      const isLastAttempt = attempt === DB_CONNECT_MAX_RETRIES;
      logError("db.connection_failed", {
        attempt,
        maxAttempts: DB_CONNECT_MAX_RETRIES,
        message,
      });

      if (isLastAttempt) {
        throw error;
      }

      await sleep(DB_CONNECT_RETRY_DELAY_MS);
    }
  }
}

const start = async () => {
  await connectDbWithRetry();
  const server = app.listen(config.port, () => {
    logInfo("api.listening", { port: Number(config.port), nodeEnv: config.nodeEnv });
  });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logInfo("api.shutdown.received", { signal });

    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          logError("api.shutdown.http_close_failed", { error: err });
        }
        resolve();
      });
    });

    try {
      await mongoose.connection.close(false);
    } catch (err) {
      logError("api.shutdown.db_close_failed", { error: err });
    }

    process.exit(0);
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      logError("api.listen.failed_port_in_use", {
        port: Number(config.port),
        message: "Port already in use",
      });
      process.exit(1);
      return;
    }

    logError("api.listen.failed", { error });
    process.exit(1);
  });
};

process.on("unhandledRejection", (reason) => {
  logError("process.unhandled_rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logError("process.uncaught_exception", { error });
  process.exit(1);
});

start().catch((error) => {
  logError("api.startup.fatal", { error });
  process.exit(1);
});
