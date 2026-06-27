import mongoose from "mongoose";

const DispatchSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String },
    rate: { type: Number },
    totalAmount: { type: Number },
    remarks: { type: String },
    status: { type: String, default: "Pending" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

DispatchSchema.index({ societyId: 1 });

export const Dispatch = mongoose.model("Dispatch", DispatchSchema);
