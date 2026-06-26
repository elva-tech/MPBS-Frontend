import { logError } from "../utils/logger.js";
import { config } from "../config/env.js";

// Error handler middleware
export function errorHandler(err, req, res, next) {
  // Log full error details server-side
  const errorMeta = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    error: err,
  };

  // Determine status code and response
  let statusCode = err.statusCode || 500;
  let responseData = {
    status: "error",
    message: "Internal server error",
  };

  // Handle Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      responseData.message = `File too large. Max allowed size is ${config.uploadMaxMb} MB`;
    } else {
      responseData.message = err.message || "Upload error";
    }
    logError("multer_error", { ...errorMeta, code: err.code });
  }
  // Handle Mongoose ValidationError
  else if (err.name === "ValidationError") {
    statusCode = 400;
    responseData.message = "Validation failed";
    responseData.details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    logError("validation_error", { ...errorMeta, details: responseData.details });
  } else if (err.name === "CastError") {
    statusCode = 400;
    responseData.message = "Invalid ID format";
    logError("cast_error", errorMeta);
  } else if (err.name === "MongoServerError" && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    responseData.message = `Duplicate value for field: ${field}`;
    logError("duplicate_key_error", { ...errorMeta, field });
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    responseData.message = "Invalid or expired token";
    logError("jwt_error", errorMeta);
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    responseData.message = err.message || "Unauthorized";
    logError("unauthorized", errorMeta);
  } else if (err.statusCode === 404) {
    statusCode = 404;
    responseData.message = err.message || "Resource not found";
    logError("not_found", errorMeta);
  } else if (err.statusCode === 403) {
    statusCode = 403;
    responseData.message = err.message || "Forbidden";
    logError("forbidden", errorMeta);
  } else if (err.statusCode === 400) {
    statusCode = 400;
    responseData.message = err.message || "Bad request";
    logError("bad_request", errorMeta);
  } else {
    // Generic server error
    logError("unhandled_error", errorMeta);
  }

  res.status(statusCode).json(responseData);
}

// Async handler wrapper to catch promise rejections
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler (should be last route)
export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.statusCode = 404;
  next(error);
}
