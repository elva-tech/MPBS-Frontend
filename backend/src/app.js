import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";

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
import procurementRoutes from "./routes/procurement.js";
import dairyRoutes from "./routes/dairy.js";
import uploadRoutes from "./routes/uploads.js";
import accountsRoutes from "./routes/accounts.js";
import claimsRoutes from "./routes/claims.js";
import recoverablesRoutes from "./routes/recoverables.js";
import schemeBenefitsRoutes from "./routes/schemeBenefits.js";
import schemeDeductionsRoutes from "./routes/schemeDeductions.js";
import cycleRoutes from "./routes/cycles.js";
import { applySecurity } from "./middleware/security.js";
import { requestIdMiddleware, requestLoggerMiddleware } from "./middleware/requestContext.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

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

function dbStateLabel(readyState) {
  if (readyState === 0) return "disconnected";
  if (readyState === 1) return "connected";
  if (readyState === 2) return "connecting";
  if (readyState === 3) return "disconnecting";
  return "unknown";
}

export async function defaultReadinessCheck() {
  const readyState = mongoose.connection.readyState;
  const state = dbStateLabel(readyState);

  if (readyState !== 1) {
    return {
      ok: false,
      checks: {
        database: {
          ok: false,
          state,
        },
      },
    };
  }

  try {
    await mongoose.connection.db.admin().ping();
    return {
      ok: true,
      checks: {
        database: {
          ok: true,
          state,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      checks: {
        database: {
          ok: false,
          state,
          error: error?.message || "ping_failed",
        },
      },
    };
  }
}

export function createApp(options = {}) {
  const readinessCheck = options.readinessCheck || defaultReadinessCheck;
  const app = express();

  applySecurity(app);
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

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
  app.use("/files", express.static(path.resolve(process.cwd(), "public", "uploads")));

  app.get("/health/live", (req, res) => {
    res.json({
      ok: true,
      service: "mpbs-backend",
      uptimeSec: Math.floor(process.uptime()),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/ready", async (req, res) => {
    const readiness = await readinessCheck();
    const status = readiness.ok ? 200 : 503;
    res.status(status).json({
      ok: readiness.ok,
      service: "mpbs-backend",
      checks: readiness.checks,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", async (req, res) => {
    const readiness = await readinessCheck();
    const status = readiness.ok ? 200 : 503;
    res.status(status).json({
      ok: readiness.ok,
      service: "mpbs-backend",
      checks: readiness.checks,
      timestamp: new Date().toISOString(),
    });
  });

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
  app.use("/procurement", procurementRoutes);
  app.use("/dairy", dairyRoutes);
  app.use("/uploads", uploadRoutes);
  app.use("/claims", claimsRoutes);
  app.use("/recoverables", recoverablesRoutes);
  app.use("/scheme-benefits", schemeBenefitsRoutes);
  app.use("/scheme-deductions", schemeDeductionsRoutes);
  app.use("/api/cycles", cycleRoutes);
  app.use("/", accountsRoutes);

  // 404 handler (must be before error handler)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}