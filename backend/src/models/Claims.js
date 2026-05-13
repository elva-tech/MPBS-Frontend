import mongoose from "mongoose";

const ClaimsSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Bonus", "Compensation", "SchemePayout", "Other"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    societyId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "applied", "rejected"],
      default: "pending",
    },
    appliedDate: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String },
  },
  { timestamps: true }
);

ClaimsSchema.index({ societyId: 1, billingCycleId: 1 });
ClaimsSchema.index({ status: 1 });

export const Claims = mongoose.model("Claims", ClaimsSchema);
