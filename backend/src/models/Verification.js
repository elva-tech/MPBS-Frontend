import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    bmcId: { type: String },
    date: { type: String, required: true },
    session: { type: String, enum: ["M", "E"], required: true },
    verifyChoice: { type: String, enum: ["YES", "NO"], required: true },
    entries: { type: Array, default: [] },
    bmcEntries: { type: Array, default: [] },
    comparisonStatus: { type: String, default: "-" },
    savedBy: { type: String },
  },
  { timestamps: true }
);

VerificationSchema.index({ societyId: 1, date: 1, session: 1 });

export const Verification = mongoose.model("Verification", VerificationSchema);
