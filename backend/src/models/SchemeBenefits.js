import mongoose from "mongoose";

const SchemeBenefitsSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    description: { type: String },
    societyId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    schemeType: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "applied", "cancelled"],
      default: "pending",
    },
    appliedDate: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String },
  },
  { timestamps: true }
);

SchemeBenefitsSchema.index({ societyId: 1, billingCycleId: 1 });
SchemeBenefitsSchema.index({ status: 1 });

export const SchemeBenefits = mongoose.model(
  "SchemeBenefits",
  SchemeBenefitsSchema
);
