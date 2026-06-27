import mongoose from "mongoose";
import { logError, logInfo } from "../utils/logger.js";

/**
 * Execute a function within a database transaction
 * @param {Function} fn - Async function to execute within transaction
 * @param {Object} options - Transaction options
 * @param {number} options.maxCommitTimeMS - Max commit time
 * @returns {Promise} Result of the function execution
 */
export async function withTransaction(fn, options = {}) {
  const session = await mongoose.startSession();
  session.startTransaction(options);

  try {
    const result = await fn(session);
    await session.commitTransaction();
    logInfo("transaction_committed", { options });
    return result;
  } catch (error) {
    await session.abortTransaction();
    logError("transaction_aborted", { error, options });
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Helper to pass session to mongoose operations
 * Usage: Model.find(...).session(session)
 */
export function getSessionOption(session) {
  return session ? { session } : {};
}
