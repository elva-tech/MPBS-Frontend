import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,


      enum: ["Admin", "Society", "BMC", "EO", "Dairy", "Account", "Accounts", "Audit", "Auditor", "ProcurementInputs", "Other"],

      required: true,
    },
    authStatus: {
      type: String,
      enum: ["Approved", "Pending", "Rejected"],
      default: "Pending",
    },
    profile: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ role: 1, authStatus: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ username: 1 });

export const User = mongoose.model("User", UserSchema);
