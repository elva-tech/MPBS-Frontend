import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "user_created",
        "user_deleted",
        "user_auth_status_changed",
        "user_password_reset",
        "billing_calculated",
        "claim_approved",
        "claim_rejected",
        "payment_processed",
        "report_generated",
        "data_exported",
        "config_changed",
      ],
      required: true,
    },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      role: String,
    },
    resourceType: {
      type: String,
      enum: ["User", "Society", "BillingCycle", "Claim", "Payment", "Report", "Config"],
    },
    resourceId: String,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    errorMessage: String,
  },
  { timestamps: true }
);

// Indexes for audit trail queries
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ "actor.userId": 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
