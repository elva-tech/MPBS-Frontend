import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = String(nodeEnv).toLowerCase() === "production";

const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
const corsOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs",
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  corsOrigins,
  nodeEnv,
  isProduction,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 5),
};

function requireInProduction(condition, message) {
  if (isProduction && !condition) {
    throw new Error(`[config] ${message}`);
  }
}

requireInProduction(Boolean(config.mongoUri), "MONGODB_URI is required in production");
requireInProduction(Boolean(config.jwtSecret), "JWT_SECRET is required in production");
requireInProduction(config.jwtSecret !== "dev_secret", "JWT_SECRET must not use default dev_secret in production");
requireInProduction(config.corsOrigins.length > 0, "CORS_ORIGIN must include at least one origin in production");
requireInProduction(Number.isFinite(config.uploadMaxMb) && config.uploadMaxMb > 0, "UPLOAD_MAX_MB must be a positive number");
