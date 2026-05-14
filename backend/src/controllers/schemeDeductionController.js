import { SchemeDeduction } from "../models/SchemeDeduction.js";
import { Society } from "../models/Society.js";

const ALL_SOCIETIES_VALUE = "ALL";

export const createSchemeDeduction = async (req, res) => {
  try {
    const { amount, description, societyId, billingCycleId, deductionType, remarks } = req.body;

    // Validate inputs
    if (!amount || !societyId || !billingCycleId || !deductionType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Verify society exists unless this applies to all societies
    if (societyId !== ALL_SOCIETIES_VALUE) {
      const society = await Society.findOne({ societyId });
      if (!society) {
        return res.status(404).json({ error: "Society not found" });
      }
    }

    const deduction = new SchemeDeduction({
      amount,
      description,
      societyId,
      billingCycleId,
      deductionType,
      remarks,
      approvedBy: req.user._id,
      status: "approved",
    });

    await deduction.save();
    res.status(201).json(deduction);
  } catch (error) {
    console.error("Error creating scheme deduction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSchemeDeductions = async (req, res) => {
  try {
    const { societyId, billingCycleId, status, bmcId, allSocieties, limit = 100, skip = 0 } = req.query;

    const filter = {};
    
    // If allSocieties is true, don't filter by societyId
    if (allSocieties !== "true") {
      // Filter by specific society
      if (societyId) {
        const societyIds = Array.isArray(societyId) ? societyId : [societyId];
        filter.societyId = { $in: [...societyIds, ALL_SOCIETIES_VALUE] };
      }
      
      // Filter by BMC (get all societies under a BMC)
      if (bmcId) {
        const { Society } = await import("../models/Society.js");
        const societies = await Society.find({ bmcId });
        const societyIds = societies.map((s) => s.societyId);
        filter.societyId = { $in: [...societyIds, ALL_SOCIETIES_VALUE] };
      }
    }
    
    if (billingCycleId) filter.billingCycleId = billingCycleId;
    if (status) filter.status = Array.isArray(status) ? { $in: status } : status;

    const total = await SchemeDeduction.countDocuments(filter);
    const deductions = await SchemeDeduction.find(filter)
      .populate("approvedBy", "name email")
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ createdAt: -1 });

    res.json({
      data: deductions,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: Number(skip) + deductions.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching scheme deductions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSchemeDeductionById = async (req, res) => {
  try {
    const { id } = req.params;

    const deduction = await SchemeDeduction.findById(id).populate("approvedBy", "name email");

    if (!deduction) {
      return res.status(404).json({ error: "Scheme deduction not found" });
    }

    res.json(deduction);
  } catch (error) {
    console.error("Error fetching scheme deduction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSchemeDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, remarks, status, deductionType } = req.body;

    const deduction = await SchemeDeduction.findById(id);
    if (!deduction) {
      return res.status(404).json({ error: "Scheme deduction not found" });
    }

    if (deduction.status === "applied" || deduction.status === "cancelled") {
      return res.status(400).json({ error: "Cannot update deduction in current status" });
    }

    if (amount && amount > 0) deduction.amount = amount;
    if (description !== undefined) deduction.description = description;
    if (remarks !== undefined) deduction.remarks = remarks;
    if (status) {
      deduction.status = status;
      if (status === "applied") {
        deduction.appliedDate = new Date();
        deduction.appliedBy = req.user._id;
      }
    }
    if (deductionType) deduction.deductionType = deductionType;

    await deduction.save();
    res.json(deduction);
  } catch (error) {
    console.error("Error updating scheme deduction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSchemeDeduction = async (req, res) => {
  try {
    const { id } = req.params;

    const deduction = await SchemeDeduction.findById(id);
    if (!deduction) {
      return res.status(404).json({ error: "Scheme deduction not found" });
    }

    if (deduction.status === "applied") {
      return res.status(400).json({ error: "Cannot delete applied deduction" });
    }

    await SchemeDeduction.deleteOne({ _id: id });
    res.json({ message: "Scheme deduction deleted successfully" });
  } catch (error) {
    console.error("Error deleting scheme deduction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSchemeDeductionsByCycle = async (req, res) => {
  try {
    const { billingCycleId } = req.params;

    const deductions = await SchemeDeduction.find({ billingCycleId, status: "applied" });

    // Group by society
    const groupedBySociety = {};
    deductions.forEach((deduction) => {
      if (!groupedBySociety[deduction.societyId]) {
        groupedBySociety[deduction.societyId] = [];
      }
      groupedBySociety[deduction.societyId].push(deduction);
    });

    res.json(groupedBySociety);
  } catch (error) {
    console.error("Error fetching scheme deductions by cycle:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
