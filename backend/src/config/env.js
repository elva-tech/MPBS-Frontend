import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = String(nodeEnv).toLowerCase() === "production";

const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
const corsOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const jwtSecret = process.env.JWT_SECRET || "dev_secret";
const jwtExpiry = process.env.JWT_EXPIRY || "7d";

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs",
  jwtSecret,
  jwtExpiry,
  corsOrigins,
  corsCredentials: process.env.CORS_CREDENTIALS === "true",
  nodeEnv,
  isProduction,
  logLevel: process.env.LOG_LEVEL || "info",
  requestLogSampleRate: Number(process.env.REQUEST_LOG_SAMPLE_RATE || 1),
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 5),
  db: {
    connectMaxRetries: Number(process.env.DB_CONNECT_MAX_RETRIES || 15),
    connectRetryDelayMs: Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 2000),
    queryTimeoutMs: Number(process.env.DB_QUERY_TIMEOUT_MS || 30000),
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
    authMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  },
};

function validateConfig() {
  // Validate port
  if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error("[config] PORT must be a valid port number (1-65535)");
  }

  // Validate MongoDB URI
  if (!config.mongoUri || !config.mongoUri.startsWith("mongodb")) {
    throw new Error("[config] MONGODB_URI must be a valid MongoDB connection string");
  }

  // Validate JWT secret length
  if (jwtSecret.length < 32) {
    const msg = "[config] JWT_SECRET must be at least 32 characters long";
    if (isProduction) throw new Error(msg);
    else console.warn(`⚠ ${msg} (dev mode allows short secrets)`);
  }

  // Production-only checks
  if (isProduction) {
    if (jwtSecret === "dev_secret" || jwtSecret === "your-production-secret-key-min-32-chars-required") {
      throw new Error("[config] JWT_SECRET must not use default or placeholder value in production");
    }
    if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
      throw new Error("[config] AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured in production");
    }
    if (config.corsOrigins.length === 0) {
      throw new Error("[config] CORS_ORIGIN must include at least one origin in production");
    }
    if (!Number.isFinite(config.uploadMaxMb) || config.uploadMaxMb <= 0) {
      throw new Error("[config] UPLOAD_MAX_MB must be a positive number in production");
    }
  }
}

// Run validation on startup
validateConfig();
