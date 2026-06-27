import mongoose from "mongoose";

const InventoryTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    transactionType: { type: String, enum: ["IN", "OUT", "ADJ"], required: true },
    quantity: { type: Number, required: true },
    referenceNo: { type: String },
    vendor: { type: String },
    invoiceNumber: { type: String },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

InventoryTransactionSchema.index({ productId: 1 });

export const InventoryTransaction = mongoose.model("InventoryTransaction", InventoryTransactionSchema);
