import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import path from "path";
import { connectDb } from "./config/db.js";
import { config } from "./config/env.js";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import societyRoutes from "./routes/societies.js";
import milkRoutes from "./routes/milkEntries.js";
import verificationRoutes from "./routes/verifications.js";
import rateRoutes from "./routes/rates.js";
import dashboardRoutes from "./routes/dashboards.js";
import notificationRoutes from "./routes/notifications.js";
import requestRoutes from "./routes/requests.js";
import reportRoutes from "./routes/reports.js";
import uploadRoutes from "./routes/uploads.js";
import { applySecurity } from "./middleware/security.js";

const app = express();
applySecurity(app);

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
        console.log(`MongoDB connected after ${attempt} attempts.`);
      }
      return;
    } catch (error) {
      const message = error?.message || String(error);
      const isLastAttempt = attempt === DB_CONNECT_MAX_RETRIES;
      console.error(`MongoDB connection failed (${attempt}/${DB_CONNECT_MAX_RETRIES}): ${message}`);

      if (isLastAttempt) {
        throw error;
      }

      await sleep(DB_CONNECT_RETRY_DELAY_MS);
    }
  }
}

function isAllowedDevelopmentOrigin(origin) {
  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      const isDevelopment = String(config.nodeEnv || "").toLowerCase() === "development";
      if (!origin) return callback(null, true);
      if (isDevelopment && isAllowedDevelopmentOrigin(origin)) {
        return callback(null, true);
      }
      if (config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(config.isProduction ? "combined" : "dev"));
app.use("/files", express.static(path.resolve(process.cwd(), "public", "uploads")));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/societies", societyRoutes);
app.use("/milk-entries", milkRoutes);
app.use("/verifications", verificationRoutes);
app.use("/rates", rateRoutes);
app.use("/dashboards", dashboardRoutes);
app.use("/notifications", notificationRoutes);
app.use("/requests", requestRoutes);
app.use("/reports", reportRoutes);
app.use("/uploads", uploadRoutes);

app.use((err, req, res, next) => {
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ message: `File too large. Max allowed size is ${config.uploadMaxMb} MB` });
    }
    return res.status(400).json({ message: err.message || "Upload error" });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const start = async () => {
  await connectDbWithRetry();
  const server = app.listen(config.port, () => {
    console.log(`API listening on :${config.port}`);
  });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}. Shutting down gracefully...`);

    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error("Error while closing HTTP server:", err);
        }
        resolve();
      });
    });

    try {
      await mongoose.connection.close(false);
    } catch (err) {
      console.error("Error while closing MongoDB connection:", err);
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
      console.error(`Port ${config.port} is already in use. Stop the existing backend process before starting a new one.`);
      process.exit(1);
      return;
    }

    console.error("Server failed to start:", error);
    process.exit(1);
  });
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

start().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
