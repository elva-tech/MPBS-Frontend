import { MilkEntry } from "../models/MilkEntry.js";
import { Claims } from "../models/Claims.js";
import { Recoverables } from "../models/Recoverables.js";
import { SchemeBenefits } from "../models/SchemeBenefits.js";
import { SchemeDeduction } from "../models/SchemeDeduction.js";

const round = (value, digits = 2) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(digits));
};

const ALL_SOCIETIES_VALUE = "ALL";

/**
 * Calculate milk procurement value for a society in a billing cycle
 */
export const calculateMilkValue = async (societyId, billingCycleId, cycleStartDate, cycleEndDate) => {
  try {
    const entries = await MilkEntry.find({
      societyId,
      date: {
        $gte: cycleStartDate,
        $lte: cycleEndDate,
      },
    });

    const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    return round(totalAmount);
  } catch (error) {
    console.error("Error calculating milk value:", error);
    return 0;
  }
};

/**
 * Get total claims for a society in a cycle
 */
export const getTotalClaims = async (societyId, billingCycleId) => {
  try {
    const claims = await Claims.find({
      societyId: { $in: [societyId, ALL_SOCIETIES_VALUE] },
      billingCycleId,
      status: { $in: ["approved", "applied"] },
    });

    const total = claims.reduce((sum, claim) => sum + (claim.amount || 0), 0);
    return round(total);
  } catch (error) {
    console.error("Error calculating claims:", error);
    return 0;
  }
};

/**
 * Get total recoverables for a society in a cycle
 */
export const getTotalRecoverables = async (societyId, billingCycleId) => {
  try {
    // Get active recoverables for this society
    const recoverables = await Recoverables.find({
      societyId: { $in: [societyId, ALL_SOCIETIES_VALUE] },
      status: { $in: ["active", "completed"] },
    });

    let total = 0;

    // For each recoverable, check if it applies to this cycle
    for (const rec of recoverables) {
      // Check if this cycle is within the recovery period
      const cyclesCompleted = rec.appliedCycles.length;
      if (cyclesCompleted < rec.totalCycles) {
        total += round(rec.amountPerCycle);
      }
    }

    return round(total);
  } catch (error) {
    console.error("Error calculating recoverables:", error);
    return 0;
  }
};

/**
 * Get total scheme benefits for a society in a cycle
 */
export const getTotalSchemeBenefits = async (societyId, billingCycleId) => {
  try {
    const benefits = await SchemeBenefits.find({
      societyId: { $in: [societyId, ALL_SOCIETIES_VALUE] },
      billingCycleId,
      status: { $in: ["approved", "applied"] },
    });

    const total = benefits.reduce((sum, benefit) => sum + (benefit.amount || 0), 0);
    return round(total);
  } catch (error) {
    console.error("Error calculating scheme benefits:", error);
    return 0;
  }
};

/**
 * Get total scheme deductions for a society in a cycle
 */
export const getTotalSchemeDeductions = async (societyId, billingCycleId) => {
  try {
    const deductions = await SchemeDeduction.find({
      societyId: { $in: [societyId, ALL_SOCIETIES_VALUE] },
      billingCycleId,
      status: { $in: ["approved", "applied"] },
    });

    const total = deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
    return round(total);
  } catch (error) {
    console.error("Error calculating scheme deductions:", error);
    return 0;
  }
};

/**
 * Calculate net payable for a society in a cycle
 * Formula: Milk Value + (Claims * Society Count) + (Scheme Benefits * Society Count) - Recoverables - Scheme Deductions
 */
export const calculateNetPayable = async (
  societyId,
  billingCycleId,
  cycleStartDate,
  cycleEndDate,
  societyCount = 1
) => {
  try {
    const milkValue = await calculateMilkValue(societyId, billingCycleId, cycleStartDate, cycleEndDate);
    const claims = await getTotalClaims(societyId, billingCycleId);
    const recoverables = await getTotalRecoverables(societyId, billingCycleId);
    const schemeBenefits = await getTotalSchemeBenefits(societyId, billingCycleId);
    const schemeDeductions = await getTotalSchemeDeductions(societyId, billingCycleId);
    // calculateNetPayable returns values for a single society (no cross-society multiplier)
    const totalClaims = claims;
    const totalSchemeBenefits = schemeBenefits;
    const netPayable = milkValue + totalClaims + totalSchemeBenefits - recoverables - schemeDeductions;

    return {
      milkValue: round(milkValue),
      additions: {
        claims: round(totalClaims),
        schemeBenefits: round(totalSchemeBenefits),
        total: round(totalClaims + totalSchemeBenefits),
      },
      deductions: {
        recoverables: round(recoverables),
        schemeDeductions: round(schemeDeductions),
        total: round(recoverables + schemeDeductions),
      },
      netPayable: round(Math.max(0, netPayable)),
    };
  } catch (error) {
    console.error("Error calculating net payable:", error);
    return {
      milkValue: 0,
      additions: { claims: 0, schemeBenefits: 0, total: 0 },
      deductions: { recoverables: 0, schemeDeductions: 0, total: 0 },
      netPayable: 0,
    };
  }
};

/**
 * Get billing summary for all societies in a cycle
 */
export const getBillingCycleSummary = async (billingCycleId, cycleStartDate, cycleEndDate, societyIds) => {
  try {
    const summaryByBmcId = {};
      for (const societyId of societyIds) {
        // per-society summary should not apply cross-society multipliers
        const payableData = await calculateNetPayable(societyId, billingCycleId, cycleStartDate, cycleEndDate, 1);

        if (!summaryByBmcId[societyId]) summaryByBmcId[societyId] = payableData;
      }

    return summaryByBmcId;
  } catch (error) {
    console.error("Error calculating billing cycle summary:", error);
    return {};
  }
};

/**
 * Get dashboard metrics for all societies in a cycle
 * Returns totals for dashboard display
 */
export const getDashboardMetrics = async (billingCycleId, cycleStartDate, cycleEndDate, societyIds) => {
  try {
    const [milkEntries, claims, schemeBenefits, schemeDeductions, recoverables] = await Promise.all([
      MilkEntry.find({ date: { $gte: cycleStartDate, $lte: cycleEndDate } }, "amount qty"),
      Claims.find({ billingCycleId, status: { $in: ["approved", "applied"] } }, "amount"),
      SchemeBenefits.find({ billingCycleId, status: { $in: ["approved", "applied"] } }, "amount"),
      SchemeDeduction.find({ billingCycleId, status: { $in: ["approved", "applied"] } }, "amount"),
      Recoverables.find({ status: "active" }, "amountPerCycle totalCycles appliedCycles"),
    ]);

    const totalMilkAmount = round(milkEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0));
    const totalClaims = round(claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0));
    const totalSchemeBenefits = round(schemeBenefits.reduce((sum, benefit) => sum + Number(benefit.amount || 0), 0));
    const totalSchemeDeductions = round(schemeDeductions.reduce((sum, deduction) => sum + Number(deduction.amount || 0), 0));
    const totalRecoverables = round(
      recoverables.reduce((sum, recoverable) => {
        const appliedCycles = Array.isArray(recoverable.appliedCycles) ? recoverable.appliedCycles : [];
        if (appliedCycles.length >= Number(recoverable.totalCycles || 0)) return sum;
        return sum + Number(recoverable.amountPerCycle || 0);
      }, 0)
    );
    const totalPayable = round(totalMilkAmount + totalClaims + totalSchemeBenefits);
    const totalDeductions = round(totalRecoverables + totalSchemeDeductions);
    const netPayableSum = round(totalPayable - totalDeductions);

    return {
      totalMilkValue: round(totalMilkAmount),
      totalPayable: round(totalPayable),
      totalDeductions: round(totalDeductions),
      netPayable: round(netPayableSum),
      breakdown: {
        additions: {
          milkValue: round(totalMilkAmount),
          claims: round(totalClaims),
          schemeBenefits: round(totalSchemeBenefits),
        },
        deductions: {
          recoverables: round(totalRecoverables),
          schemeDeductions: round(totalSchemeDeductions),
        },
      },
    };
  } catch (error) {
    console.error("Error calculating dashboard metrics:", error);
    return {
      totalMilkValue: 0,
      totalPayable: 0,
      totalDeductions: 0,
      netPayable: 0,
      breakdown: {
        additions: { milkValue: 0, claims: 0, schemeBenefits: 0 },
        deductions: { recoverables: 0, schemeDeductions: 0 },
      },
    };
  }
};
