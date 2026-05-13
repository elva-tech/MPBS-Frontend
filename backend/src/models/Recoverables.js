import mongoose from "mongoose";

const RecoverablesSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["FeedCost", "LoanRecovery", "MineralMixture", "Other"],
      required: true,
    },
    totalAmount: { type: Number, required: true },
    amountPerCycle: { type: Number, required: true },
    totalCycles: { type: Number, required: true },
    description: { type: String },
    societyId: { type: String, required: true, index: true },
    startCycleId: { type: String, required: true },
    currentCycleIndex: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    appliedCycles: [
      {
        cycleId: String,
        amount: Number,
        appliedDate: Date,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String },
  },
  { timestamps: true }
);

RecoverablesSchema.index({ societyId: 1, status: 1 });
RecoverablesSchema.index({ startCycleId: 1 });

export const Recoverables = mongoose.model("Recoverables", RecoverablesSchema);
