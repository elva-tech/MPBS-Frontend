import { Rate } from "../models/Rate.js";

export async function calcRate(req, res) {
  const { qty } = req.body;
  const rate = 45;
  const amount = qty ? Number((rate * qty).toFixed(2)) : undefined;
  res.json({ rate, amount });
}

export async function listRates(req, res) {
  const { milkType } = req.query;
  const q = milkType ? { milkType } : {};
  const rows = await Rate.find(q).sort({ minFat: 1, minSnf: 1 });
  res.json({ data: rows });
}
