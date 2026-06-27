import mongoose from "mongoose";

const RateSchema = new mongoose.Schema(
  {
    milkType: { type: String, enum: ["Cow", "Buffalo"], required: true },
    minFat: { type: Number, required: true },
    maxFat: { type: Number, required: true },
    minSnf: { type: Number, required: true },
    maxSnf: { type: Number, required: true },
    rate: { type: Number, required: true },
  },
  { timestamps: true }
);

RateSchema.index({ milkType: 1, minFat: 1, maxFat: 1, minSnf: 1, maxSnf: 1 });

export const Rate = mongoose.model("Rate", RateSchema);
