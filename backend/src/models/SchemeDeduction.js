import mongoose from "mongoose";

const SchemeDeductionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    description: { type: String },
    societyId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    deductionType: { type: String, required: true },
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

SchemeDeductionSchema.index({ societyId: 1, billingCycleId: 1 });
SchemeDeductionSchema.index({ status: 1 });

export const SchemeDeduction = mongoose.model(
  "SchemeDeduction",
  SchemeDeductionSchema
);
