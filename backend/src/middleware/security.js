import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { config } from "../config/env.js";

export function applySecurity(app) {
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(compression());

  const devMax = Number(process.env.RATE_LIMIT_DEV_MAX || 5000);
  const apiMax = config.isProduction ? config.rateLimit.maxRequests : devMax;

  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: apiMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health" || req.path.startsWith("/health/"),
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: config.isProduction ? config.rateLimit.authMaxRequests : 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/auth/login", authLimiter);
  app.use("/auth", apiLimiter);
  app.use(apiLimiter);
}
