import { InventoryTransaction } from "../models/InventoryTransaction.js";
import { Product } from "../models/Product.js";
import { z } from "zod";

export async function addStockInward(req, res) {
  const schema = z.object({ productId: z.string().min(1), quantity: z.number().positive(), vendor: z.string().optional(), invoiceNumber: z.string().optional(), referenceNo: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

  const { productId, quantity, vendor, invoiceNumber, referenceNo } = parsed.data;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const tx = new InventoryTransaction({ productId, transactionType: "IN", quantity, vendor, invoiceNumber, referenceNo });
  await tx.save();

  product.stockQty = Number(product.stockQty || 0) + Number(quantity || 0);
  await product.save();

  res.status(201).json({ data: tx, product });
}

export async function getInventory(req, res) {
  const q = {};
  if (req.query.productId) q.productId = req.query.productId;
  const transactions = await InventoryTransaction.find(q).sort({ createdAt: -1 }).limit(200);
  res.json({ data: transactions });
}
