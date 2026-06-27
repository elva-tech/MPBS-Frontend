import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import rateLimit from "express-rate-limit";

export function applySecurity(app) {
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(compression());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/auth/login", authLimiter);
  app.use("/auth", apiLimiter);
  app.use(apiLimiter);
}
