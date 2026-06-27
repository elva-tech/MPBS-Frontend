import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, required: true },
    rate: { type: Number, required: true, default: 0 },
    stockQty: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, default: "Active" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 1 });

export const Product = mongoose.model("Product", ProductSchema);
