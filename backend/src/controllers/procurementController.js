import { Society } from "../models/Society.js";

function parseNumericQty(q) {
  if (q == null) return 0;
  const asStr = String(q);
  const num = parseFloat(asStr.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

export async function createDispatch(req, res) {
  const { society, date, remarks, items } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No dispatch items provided" });
  }

  // determine target societies
  let targets = [];
  if (String(society || "").toUpperCase() === "ALL") {
    targets = await Society.find({}, "societyId societyName feedMineral");
  } else {
    const socId = String(society || "").split(" - ")[0].trim();
    if (!socId) return res.status(400).json({ message: "Invalid society identifier" });
    const s = await Society.findOne({ societyId: socId });
    if (!s) return res.status(404).json({ message: "Society not found" });
    targets = [s];
  }

  const receivedDate = date || new Date().toISOString().split("T")[0];

  for (const soc of targets) {
    const fm = Array.isArray(soc.feedMineral) ? [...soc.feedMineral] : [];

    for (const it of items) {
      const name = String(it.product || it.name || "").trim();
      const unit = String(it.unit || "").trim();
      const qty = Number(it.quantity || it.qty || 0);
      if (!name || !(qty > 0)) continue;

      const idx = fm.findIndex((x) => String(x.name || "").toLowerCase() === name.toLowerCase());
      if (idx >= 0) {
        const existing = fm[idx];
        const existingQty = parseNumericQty(existing.qty || existing.qtyKg || existing.qtyLt || 0);
        const newQty = existingQty + qty;
        fm[idx] = { ...existing, name, qty: `${newQty} ${unit}`.trim(), lastReceived: receivedDate };
      } else {
        fm.push({ name, qty: `${qty} ${unit}`.trim(), lastReceived: receivedDate });
      }
    }

    soc.feedMineral = fm;
    try {
      // save updated society
      // eslint-disable-next-line no-await-in-loop
      await soc.save();
    } catch (err) {
      // continue updating others
      console.error("Failed updating society feedMineral", soc.societyId, err?.message || err);
    }
  }

  return res.json({ ok: true, updated: targets.length });
}
