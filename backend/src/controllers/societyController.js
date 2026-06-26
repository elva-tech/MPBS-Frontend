import { Society } from "../models/Society.js";
import { getPagination, makePaginationMeta } from "../utils/pagination.js";

export async function listSocieties(req, res) {
  const query = {};
  
  // If logged-in user is BMC, filter societies by their BMC ID
  if (req.user && req.user.role === "BMC") {
    const bmcId = req.user.username;
    query.bmcId = bmcId;
  }
  
  // Include feedMineral data for users who need procurement details
  let projection = "societyId societyName district taluk contactNumber bmcId";
  if (req.user && ["Admin", "ProcurementInputs", "BMC"].includes(req.user.role)) {
    projection += " feedMineral";
  }
  const pagination = getPagination(req.query);

  if (!pagination.enabled) {
    const list = await Society.find(query, projection).sort({ societyName: 1 });
    return res.json({ data: list });
  }

  const { page, limit, skip } = pagination;
  const [list, total] = await Promise.all([
    Society.find(query, projection).sort({ societyName: 1 }).skip(skip).limit(limit),
    Society.countDocuments(query),
  ]);

  return res.json({ data: list, meta: makePaginationMeta(total, page, limit) });
}
