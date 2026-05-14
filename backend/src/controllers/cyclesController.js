import { getCycleStatusSummary } from "../services/cycleService.js";

export function getCycleStatus(req, res, next) {
  try {
    const data = getCycleStatusSummary(new Date());
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}