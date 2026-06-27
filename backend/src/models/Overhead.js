import mongoose from "mongoose";

const OverheadSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // YYYY-MM
    societyId: { type: String },
    bmcId: { type: String },
    diesel: { type: Number, default: 0 },
    secretary: { type: Number, default: 0 },
    repair: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OverheadSchema.index({ month: 1, societyId: 1, bmcId: 1 });

export const Overhead = mongoose.model("Overhead", OverheadSchema);
