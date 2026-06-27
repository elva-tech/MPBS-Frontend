import { buildCycleProgress } from "../utils/cycleProgress.js";

export function getCycleStatusSummary(referenceDate = new Date()) {
  return buildCycleProgress(referenceDate);
}