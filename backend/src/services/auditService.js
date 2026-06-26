import { AuditLog } from "../models/AuditLog.js";
import { logError, logInfo } from "../utils/logger.js";

/**
 * Create an audit log entry for sensitive operations
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action performed (e.g., 'user_created')
 * @param {Object} options.actor - Actor performing the action {userId, username, role}
 * @param {string} options.resourceType - Type of resource affected
 * @param {string} options.resourceId - ID of resource affected
 * @param {Object} options.changes - Changes made {before, after}
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.ipAddress - IP address of request
 * @param {string} options.userAgent - User agent of request
 * @param {string} options.status - Status of action ('success' or 'failure')
 * @param {string} options.errorMessage - Error message if status is 'failure'
 */
export async function createAuditLog(options = {}) {
  try {
    const {
      action,
      actor,
      resourceType,
      resourceId,
      changes,
      metadata,
      ipAddress,
      userAgent,
      status = "success",
      errorMessage,
    } = options;

    if (!action || !actor) {
      logError("audit_log_invalid_input", { action, actor });
      return null;
    }

    const auditLog = new AuditLog({
      action,
      actor,
      resourceType,
      resourceId,
      changes,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage,
    });

    await auditLog.save();
    logInfo("audit_log_created", { action, resourceType, status });
    return auditLog;
  } catch (error) {
    logError("audit_log_save_failed", { error, action: options.action });
    return null;
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(resourceType, resourceId, limit = 50) {
  try {
    const logs = await AuditLog.find({
      resourceType,
      resourceId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return logs;
  } catch (error) {
    logError("audit_log_fetch_failed", { error, resourceType, resourceId });
    return [];
  }
}

/**
 * Get audit logs for a specific actor
 */
export async function getActorAuditLogs(userId, limit = 50) {
  try {
    const logs = await AuditLog.find({
      "actor.userId": userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return logs;
  } catch (error) {
    logError("audit_log_fetch_failed", { error, userId });
    return [];
  }
}

/**
 * Get all audit logs for a specific action
 */
export async function getActionAuditLogs(action, limit = 50) {
  try {
    const logs = await AuditLog.find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return logs;
  } catch (error) {
    logError("audit_log_fetch_failed", { error, action });
    return [];
  }
}
