import mongoose from "mongoose";

const MilkEntrySchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    session: { type: String, enum: ["M", "E"], required: true },
    milkType: { type: String, enum: ["Cow", "Buffalo"], required: true },
    fat: { type: Number, required: true },
    snf: { type: Number, required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    transportPenalty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MilkEntrySchema.index({ societyId: 1, date: 1, session: 1 });
MilkEntrySchema.index({ societyId: 1, date: 1, session: 1, milkType: 1 }, { unique: true });

export const MilkEntry = mongoose.model("MilkEntry", MilkEntrySchema);
