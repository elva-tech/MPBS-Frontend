import mongoose from "mongoose";

const MilkSessionLockSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    session: { type: String, enum: ["M", "E"], required: true },
    locked: { type: Boolean, default: true },
    lockedAt: { type: Date, default: Date.now },
    unlockedAt: { type: Date },
  },
  { timestamps: true }
);

MilkSessionLockSchema.index({ societyId: 1, date: 1, session: 1 }, { unique: true });

export const MilkSessionLock = mongoose.model("MilkSessionLock", MilkSessionLockSchema);
