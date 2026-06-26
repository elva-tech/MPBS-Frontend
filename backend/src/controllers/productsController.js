import { Product } from "../models/Product.js";
import { z } from "zod";

export async function createProduct(req, res) {
  const schema = z.object({ name: z.string().min(1), unit: z.string().min(1), rate: z.number().nonnegative(), stockQty: z.number().nonnegative().optional(), status: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

  const { name, unit, rate, stockQty = 0, status = "Active" } = parsed.data;
  const existing = await Product.findOne({ name });
  if (existing) return res.status(409).json({ message: "Product already exists" });

  const p = new Product({ name, unit, rate, stockQty, status });
  await p.save();
  res.status(201).json({ data: p });
}

export async function listProducts(req, res) {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.q) query.name = new RegExp(req.query.q, "i");
  const list = await Product.find(query).sort({ name: 1 });
  res.json({ data: list });
}

export async function updateProduct(req, res) {
  const id = req.params.id;
  const schema = z.object({ name: z.string().min(1).optional(), unit: z.string().optional(), rate: z.number().nonnegative().optional(), stockQty: z.number().optional(), status: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

  const updated = await Product.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!updated) return res.status(404).json({ message: "Product not found" });
  res.json({ data: updated });
}
